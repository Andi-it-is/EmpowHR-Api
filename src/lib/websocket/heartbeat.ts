import { RawData, WebSocket, WebSocketServer } from "ws";
import { HEARTBEAT_MESSAGE } from "./messages";
import { wsLog } from "./wsLogger";

const HEARTBEAT_INTERVAL_MS = 30_000;

/**
 * Heartbeat in beide Richtungen.
 *
 * Server -> Client (Muster aus der ws-Doku):
 * Alle 30 s schickt der Server ein Ping-Frame. Browser antworten darauf automatisch mit Pong,
 * ohne dass im Frontend Code nötig ist. Kam seit dem letzten Durchlauf kein Pong,
 * ist die Verbindung tot (WLAN weg, Laptop zugeklappt) und wird mit terminate() beendet.
 * Tote Verbindungen fliegen so nach 30-60 s raus statt erst nach Minuten bis Stunden,
 * und der Reverse Proxy sieht regelmäßig Traffic und schließt die Verbindung nicht wegen Leerlauf.
 *
 * Client -> Server:
 * VueUse schickt die Textnachricht "ping" und erwartet "ping" zurück.
 * Bleibt die Antwort aus, trennt der Client selbst und verbindet sich neu.
 */
export const registerHeartbeat = (wss: WebSocketServer, intervalMs: number = HEARTBEAT_INTERVAL_MS): void => {
    // true = seit dem letzten Ping kam ein Pong. WeakMap statt Property am Socket,
    // damit kein Typ von ws erweitert werden muss und nichts liegen bleibt.
    const isAlive = new WeakMap<WebSocket, boolean>();

    // Wird nur für authentifizierte Verbindungen ausgelöst (siehe handleUpgrade in socket.ts)
    wss.on("connection", (ws: WebSocket) => {
        isAlive.set(ws, true);

        ws.on("pong", () => {
            isAlive.set(ws, true);
        });

        // Dieser Listener beantwortet nur den Heartbeat-Text "ping" (kein JSON, siehe messages.ts).
        // JSON-Nachrichten wie presence:activity verarbeitet ein eigener Listener in presence.ts.
        // Alles andere ignorieren beide Listener bewusst, statt die Verbindung zu schließen:
        // - maxPayload (socket.ts) begrenzt die Größe ohnehin auf wenige KB
        // - ein Close würde VueUse neu verbinden lassen; bei einem Frontend-Bug, der
        //   ständig etwas Falsches schickt, entstünde eine Reconnect-Schleife und der
        //   Online-Zähler würde flackern
        ws.on("message", (data: RawData, isBinary: boolean) => {
            if (!isBinary && data.toString() === HEARTBEAT_MESSAGE) {
                ws.send(HEARTBEAT_MESSAGE);
            }
        });
    });

    const interval = setInterval(() => {
        // wss.clients enthält alle Sockets nach dem Upgrade, also auch die gerade mit 4401
        // geschlossenen. Die haben keinen Eintrag (undefined) und werden ebenfalls beendet.
        for (const ws of wss.clients) {
            const alive = isAlive.get(ws);
            if (alive !== true) {
                // false = authentifiziert, aber kein Pong. undefined = gerade mit 4401 geschlossen,
                // das wurde schon beim Handshake geloggt.
                if (alive === false) {
                    wsLog("Heartbeat: kein Pong - Verbindung wird beendet");
                }
                // terminate() statt close(): Eine tote Gegenseite würde den Close-Handshake
                // nie beantworten. "close" feuert trotzdem, presence.ts räumt also auf.
                ws.terminate();
                continue;
            }

            isAlive.set(ws, false);
            ws.ping();
        }
    }, intervalMs);

    // Intervall stoppen, wenn der WebSocket-Server geschlossen wird
    wss.on("close", () => {
        clearInterval(interval);
    });
};
