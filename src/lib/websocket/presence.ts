import { IncomingMessage } from "http";
import { RawData, WebSocket, WebSocketServer } from "ws";
import { User } from "../../entity/User";
import { PRESENCE_ACTIVE_QUERY_PARAM, PRESENCE_INACTIVITY_TIMEOUT_MS, ServerMessage, parseClientMessage } from "./messages";

// Karenzzeit nach dem Schließen des letzten Tabs. Verbindet sich der User in dieser Zeit
// neu (z. B. Seite neu geladen), zählt er durchgehend als online und der Zähler springt nicht.
const OFFLINE_GRACE_PERIOD_MS = 5_000;

// So oft wird geprüft, ob User wegen Inaktivität herausfallen. Ohne diesen Tick fiele ein
// inaktiver User erst beim nächsten anderen Ereignis heraus - so spätestens 30 s nach Ablauf.
const EXPIRY_CHECK_INTERVAL_MS = 30_000;

type PresenceEntry = {
    sockets: Set<WebSocket>
    // Zeitpunkt der letzten presence:activity (ms). 0 = seit Verbindungsaufbau keine Aktivität gemeldet.
    lastActivity: number
}

export type PresenceOptions = {
    gracePeriodMs?: number
    // Für Tests verkürzbar - NICHT die Konstante in messages.ts ändern
    inactivityTimeoutMs?: number
}

/**
 * Verwaltet, welche User gerade online sind, und verteilt die Online-Zahl an alle Clients.
 *
 * Online = Eintrag in der Map (mind. ein offener Tab oder in der Karenzzeit)
 *          UND presence:activity innerhalb der letzten inactivityTimeoutMs.
 * Pro User ein Eintrag mit Set von Sockets: Mehrere Tabs eines Users zählen so nur einmal.
 * Ein User in der Karenzzeit hat ein leeres Set, bleibt aber in der Map und zählt noch mit, wenn er aktiv ist.
 */
export const registerPresence = (wss: WebSocketServer, options: PresenceOptions = {}): void => {
    const gracePeriodMs = options.gracePeriodMs ?? OFFLINE_GRACE_PERIOD_MS;
    const inactivityTimeoutMs = options.inactivityTimeoutMs ?? PRESENCE_INACTIVITY_TIMEOUT_MS;

    const connections = new Map<string, PresenceEntry>();

    // userId -> Timer, der den User nach Ablauf der Karenzzeit endgültig entfernt
    const pendingRemovals = new Map<string, NodeJS.Timeout>();

    // Zuletzt an alle verschickte Zahl - gesendet wird nur bei einer Änderung
    let lastSentCount = 0;

    const send = (ws: WebSocket, message: ServerMessage): void => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    };

    const countOnline = (): number => {
        const now = Date.now();
        let online = 0;
        for (const entry of connections.values()) {
            if (now - entry.lastActivity <= inactivityTimeoutMs) online++;
        }
        return online;
    };

    const countMessage = (online: number): ServerMessage => ({
        type: "presence:count",
        payload: { online }
    });

    /**
     * Rechnet die Zahl neu aus und schickt sie nur bei einer Änderung an alle.
     * Nur an authentifizierte Sockets aus der Map - nicht an wss.clients,
     * dort stecken auch die gerade mit 4401 geschlossenen Verbindungen.
     *
     * @returns true, wenn verschickt wurde
     */
    const updateCount = (): boolean => {
        const online = countOnline();
        if (online === lastSentCount) return false;
        lastSentCount = online;

        const message = countMessage(online);
        for (const entry of connections.values()) {
            for (const ws of entry.sockets) {
                send(ws, message);
            }
        }
        return true;
    };

    // Wird nur für authentifizierte Verbindungen ausgelöst (siehe handleUpgrade in socket.ts)
    wss.on("connection", (ws: WebSocket, req: IncomingMessage, user: User) => {
        // Rückkehr innerhalb der Karenzzeit: Entfernen abbrechen. lastActivity bleibt erhalten.
        const pending = pendingRemovals.get(user.id);
        if (pending) {
            clearTimeout(pending);
            pendingRemovals.delete(user.id);
        }

        let entry = connections.get(user.id);
        if (!entry) {
            // lastActivity = 0, NICHT Date.now(): Ein Verbindungsaufbau an sich ist keine Aktivität.
            // Sonst zählte ein vergessener Tab nach jedem automatischen Reconnect (z. B. nach einem
            // Deploy) wieder 30 Minuten mit. Ist die letzte Eingabe des Clients jünger als der Timeout,
            // meldet er das beim Verbindungsaufbau über ?active=1 (siehe unten), nicht über presence:activity.
            entry = { sockets: new Set(), lastActivity: 0 };
            connections.set(user.id, entry);
        }
        entry.sockets.add(ws);

        // Aktivität beim Verbindungsaufbau (?active=1) - für neue UND bestehende Einträge
        // (weiterer Tab, Rückkehr in der Karenzzeit). Nur genau "1" zählt, alles andere wie kein Parameter.
        // Muss VOR updateCount() stehen, damit schon die erste Nachricht den eigenen User enthält.
        const { searchParams } = new URL(req.url ?? "", "http://localhost");
        if (searchParams.get(PRESENCE_ACTIVE_QUERY_PARAM) === "1") {
            entry.lastActivity = Date.now();
        }

        // Neue Verbindung bekommt IMMER sofort den aktuellen Stand - auch wenn sich die Zahl nicht
        // ändert (z. B. weiterer Tab). Hat updateCount schon an alle geschickt, ist die neue
        // Verbindung dabei und braucht keine zweite Nachricht.
        if (!updateCount()) {
            send(ws, countMessage(lastSentCount));
        }

        // Eigener Listener neben dem in heartbeat.ts: "ping" ist kein JSON, parseClientMessage
        // liefert dafür null - die beiden Listener stören sich also nicht.
        // Kein Rate-Limit nötig: Der Client drosselt auf 1x pro Minute, hier wird nur ein
        // Zeitstempel gesetzt, und maxPayload (socket.ts) begrenzt die Größe.
        ws.on("message", (data: RawData, isBinary: boolean) => {
            if (isBinary) return;

            const message = parseClientMessage(data.toString());
            if (message?.type === "presence:activity") {
                entry.lastActivity = Date.now();
                updateCount();
            }
            // Alles andere ignorieren, NICHT die Verbindung schließen (Begründung in heartbeat.ts)
        });

        ws.on("close", () => {
            entry.sockets.delete(ws);
            if (entry.sockets.size > 0) return;

            // Letzter Tab geschlossen: noch nicht sofort offline, erst nach der Karenzzeit
            const timer = setTimeout(() => {
                pendingRemovals.delete(user.id);

                // Sicherheitsprüfung: nur entfernen, wenn in der Zwischenzeit nichts dazukam
                const current = connections.get(user.id);
                if (current && current.sockets.size === 0) {
                    connections.delete(user.id);
                    updateCount();
                }
            }, gracePeriodMs);

            pendingRemovals.set(user.id, timer);
        });
    });

    // Ablauf-Tick: inaktive User fallen heraus, auch wenn sonst nichts passiert
    const expiryInterval = setInterval(() => {
        updateCount();
    }, EXPIRY_CHECK_INTERVAL_MS);

    // Server wird geschlossen: Tick und offene Karenzzeit-Timer stoppen,
    // damit sie den Prozess nicht am Leben halten
    wss.on("close", () => {
        clearInterval(expiryInterval);
        for (const timer of pendingRemovals.values()) {
            clearTimeout(timer);
        }
        pendingRemovals.clear();
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// ALTERNATIVE (derzeit nicht aktiv): Gezieltes Senden statt Broadcast
// ─────────────────────────────────────────────────────────────────────────────
// Damit nur ausgewählte User eine Nachricht bekommen (ein einzelner User, eine Abteilung,
// eine Rolle), muss der Server zu jedem Socket wissen, wem er gehört. Dafür wird im Eintrag
// zusätzlich der User aus dem Handshake gespeichert. Online-Logik (Aktivität, updateCount,
// Karenzzeit, Ablauf-Tick) ist identisch mit registerPresence oben.
//
// Zum Aktivieren:
// - Den Block in eine eigene Datei (z. B. connections.ts) verschieben und einkommentieren.
//   Map + Sende-Funktionen liegen dort auf Modulebene, damit auch REST-Routen sie
//   importieren können ("Antrag genehmigt" -> sendToUser(...)).
// - In socket.ts registerConnections(wss) statt registerPresence(wss) aufrufen.
//
// Zu beachten:
// - user ist eine Momentaufnahme vom Handshake. Ändern sich Abteilung oder Rollen,
//   filtert der Server bis zum nächsten Verbindungsaufbau mit dem alten Stand.
// - Offline-User bekommen nichts. Was später noch sichtbar sein soll, zusätzlich in der DB speichern.
// - Gezieltes Senden geht an alle offenen Tabs, unabhängig von der Aktivität. Inaktivität
//   betrifft nur die Online-Zahl. User in der Karenzzeit haben keine Tabs und bekommen nichts.
//
// import { IncomingMessage } from "http";
// import { RawData, WebSocket, WebSocketServer } from "ws";
// import { User } from "../../entity/User";
// import { RoleName } from "../enums/acessControl.enum";
// import { PRESENCE_ACTIVE_QUERY_PARAM, PRESENCE_INACTIVITY_TIMEOUT_MS, ServerMessage, parseClientMessage } from "./messages";
//
// const OFFLINE_GRACE_PERIOD_MS = 5_000;
// const EXPIRY_CHECK_INTERVAL_MS = 30_000;
//
// type Connection = {
//     user: User              // Stand beim (letzten) Handshake, inkl. roles + department
//     sockets: Set<WebSocket>
//     lastActivity: number    // 0 = seit Verbindungsaufbau keine Aktivität gemeldet
// }
//
// const connections = new Map<string, Connection>();          // userId -> Connection
// const pendingRemovals = new Map<string, NodeJS.Timeout>();  // userId -> Timer der Karenzzeit
//
// // Grundbaustein: an alle User schicken, die eine Bedingung erfüllen
// const sendWhere = (filter: (user: User) => boolean, message: ServerMessage): void => {
//     const data = JSON.stringify(message);
//     for (const { user, sockets } of connections.values()) {
//         if (!filter(user)) continue;
//         for (const ws of sockets) {
//             if (ws.readyState === WebSocket.OPEN) ws.send(data);
//         }
//     }
// };
//
// // Broadcast an alle
// export const broadcast = (message: ServerMessage) =>
//     sendWhere(() => true, message);
//
// // Ein einzelner User: direkter Map-Zugriff, ohne über alle zu laufen
// export const sendToUser = (userId: string, message: ServerMessage): void => {
//     const connection = connections.get(userId);
//     if (!connection) return;            // offline -> nichts zu tun
//     const data = JSON.stringify(message);
//     for (const ws of connection.sockets) {
//         if (ws.readyState === WebSocket.OPEN) ws.send(data);
//     }
// };
//
// // Alle User einer Abteilung
// export const sendToDepartment = (departmentId: string, message: ServerMessage) =>
//     sendWhere(user => user.department?.id === departmentId, message);
//
// // Alle User mit einer bestimmten Rolle
// export const sendToRole = (role: RoleName, message: ServerMessage) =>
//     sendWhere(user => user.roles.some(r => r.name === role), message);
//
// /** Online-Logik wie registerPresence, aber auf Basis von Connection. */
// export const registerConnections = (
//     wss: WebSocketServer,
//     options: { gracePeriodMs?: number, inactivityTimeoutMs?: number } = {}
// ): void => {
//     const gracePeriodMs = options.gracePeriodMs ?? OFFLINE_GRACE_PERIOD_MS;
//     const inactivityTimeoutMs = options.inactivityTimeoutMs ?? PRESENCE_INACTIVITY_TIMEOUT_MS;
//     let lastSentCount = 0;
//
//     const countOnline = (): number => {
//         const now = Date.now();
//         let online = 0;
//         for (const connection of connections.values()) {
//             if (now - connection.lastActivity <= inactivityTimeoutMs) online++;
//         }
//         return online;
//     };
//
//     const countMessage = (online: number): ServerMessage => ({
//         type: "presence:count",
//         payload: { online }
//     });
//
//     // Zahl neu ausrechnen, nur bei Änderung an alle schicken. true = verschickt.
//     const updateCount = (): boolean => {
//         const online = countOnline();
//         if (online === lastSentCount) return false;
//         lastSentCount = online;
//         broadcast(countMessage(online));
//         return true;
//     };
//
//     wss.on("connection", (ws: WebSocket, req: IncomingMessage, user: User) => {
//         // Rückkehr innerhalb der Karenzzeit: Entfernen abbrechen, lastActivity bleibt erhalten
//         const pending = pendingRemovals.get(user.id);
//         if (pending) {
//             clearTimeout(pending);
//             pendingRemovals.delete(user.id);
//         }
//
//         let connection = connections.get(user.id);
//         if (connection) {
//             // Neuerer Handshake -> aktuellen Stand übernehmen (Rollen/Abteilung evtl. geändert)
//             connection.user = user;
//         } else {
//             // lastActivity = 0: Verbindungsaufbau an sich ist keine Aktivität (siehe registerPresence)
//             connection = { user, sockets: new Set(), lastActivity: 0 };
//             connections.set(user.id, connection);
//         }
//         connection.sockets.add(ws);
//
//         // Aktivität beim Verbindungsaufbau (?active=1), VOR updateCount()
//         const { searchParams } = new URL(req.url ?? "", "http://localhost");
//         if (searchParams.get(PRESENCE_ACTIVE_QUERY_PARAM) === "1") {
//             connection.lastActivity = Date.now();
//         }
//
//         // Neue Verbindung bekommt immer sofort den aktuellen Stand
//         if (!updateCount() && ws.readyState === WebSocket.OPEN) {
//             ws.send(JSON.stringify(countMessage(lastSentCount)));
//         }
//
//         ws.on("message", (data: RawData, isBinary: boolean) => {
//             if (isBinary) return;
//             const message = parseClientMessage(data.toString());
//             if (message?.type === "presence:activity") {
//                 connection.lastActivity = Date.now();
//                 updateCount();
//             }
//         });
//
//         ws.on("close", () => {
//             connection.sockets.delete(ws);
//             if (connection.sockets.size > 0) return;
//
//             // Letzter Tab geschlossen: erst nach der Karenzzeit offline
//             const timer = setTimeout(() => {
//                 pendingRemovals.delete(user.id);
//
//                 // Nur entfernen, wenn in der Zwischenzeit nichts dazukam
//                 const current = connections.get(user.id);
//                 if (current && current.sockets.size === 0) {
//                     connections.delete(user.id);
//                     updateCount();
//                 }
//             }, gracePeriodMs);
//
//             pendingRemovals.set(user.id, timer);
//         });
//     });
//
//     // Ablauf-Tick: inaktive User fallen heraus, auch wenn sonst nichts passiert
//     const expiryInterval = setInterval(() => {
//         updateCount();
//     }, EXPIRY_CHECK_INTERVAL_MS);
//
//     // Server wird geschlossen: Tick und offene Timer stoppen
//     wss.on("close", () => {
//         clearInterval(expiryInterval);
//         for (const timer of pendingRemovals.values()) {
//             clearTimeout(timer);
//         }
//         pendingRemovals.clear();
//     });
// };
