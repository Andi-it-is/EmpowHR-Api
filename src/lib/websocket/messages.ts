// ─────────────────────────────────────────────────────────────────────────────
// WebSocket-Protokoll zwischen API und Frontend
// ─────────────────────────────────────────────────────────────────────────────
// Diese Datei existiert IDENTISCH in beiden Projekten:
//   api/src/lib/websocket/messages.ts
//   frontend/src/lib/websocket/messages.ts
// Frontend und API teilen sich keinen Code - Änderungen immer in beide Dateien übernehmen.
// Keine Imports aus dem jeweiligen Projekt verwenden, damit die Datei überall gleich bleibt.

// ── Online-Status ────────────────────────────────────────────────────────────

/**
 * Ein User zählt als online, wenn er eine offene Verbindung hat (oder in der Karenzzeit nach dem
 * letzten Tab ist) UND in den letzten 30 Minuten in mindestens einem Tab aktiv war.
 * Ein Tab, der z. B. über Nacht offen bleibt, zählt damit nach 30 Minuten nicht mehr.
 */
export const PRESENCE_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Höchstens so oft schickt ein Tab presence:activity.
 * Muss deutlich kleiner sein als PRESENCE_INACTIVITY_TIMEOUT_MS.
 */
export const PRESENCE_ACTIVITY_THROTTLE_MS = 60 * 1000;

// ── Client -> Server ─────────────────────────────────────────────────────────
// Der Client schickt genau zwei Arten von Nachrichten: den Heartbeat-Text und JSON-Nachrichten
// vom Typ ClientMessage. Alles andere ignoriert der Server.

/**
 * Heartbeat-Text von VueUse (useWebSocket, Option heartbeat.message).
 * Der Server antwortet mit genau demselben Text, dann filtert VueUse die Antwort aus data heraus.
 * Kein JSON - wird vor parseClientMessage geprüft.
 */
export const HEARTBEAT_MESSAGE = "ping";

/**
 * Query-Parameter beim Verbindungsaufbau: /api/v1/ws?active=1
 * Der Client setzt ihn, wenn die letzte Eingabe im Tab weniger als PRESENCE_INACTIVITY_TIMEOUT_MS
 * zurückliegt. Der Server wertet den Verbindungsaufbau dann als Aktivität, BEVOR er die erste
 * presence:count an diese Verbindung schickt - sonst enthielte die erste Zahl den eigenen User noch nicht.
 * Ohne Parameter (z. B. Reconnect eines vergessenen Tabs) zählt die neue Verbindung nicht als aktiv.
 * Kein Geheimnis, nur ein Hinweis - gleiches Vertrauen wie presence:activity. Nie einen Token in die URL.
 */
export const PRESENCE_ACTIVE_QUERY_PARAM = "active";

/**
 * Der User hat in diesem Tab etwas getan (Maus, Tastatur, Touch, Scrollen, Zurückwechseln in den Tab).
 * Der Client schickt sie höchstens einmal pro PRESENCE_ACTIVITY_THROTTLE_MS, solange die Verbindung steht.
 * Aktivität beim Verbindungsaufbau läuft über PRESENCE_ACTIVE_QUERY_PARAM, nicht über diese Nachricht.
 */
export type PresenceActivityMessage = {
    type: "presence:activity"
}

/** Alle JSON-Nachrichten, die der Client schicken kann. Neue Typen hier ergänzen. */
export type ClientMessage = PresenceActivityMessage;

const CLIENT_MESSAGE_TYPES: ReadonlyArray<ClientMessage["type"]> = ["presence:activity"];

// ── Server -> Client ─────────────────────────────────────────────────────────
// Alle Nachrichten sind JSON mit { type, payload }. type bestimmt die Form von payload.

/**
 * online = Anzahl eindeutiger User, die nach PRESENCE_INACTIVITY_TIMEOUT_MS als online gelten.
 * Mehrere Tabs eines Users zählen einmal.
 */
export type PresenceCountMessage = {
    type: "presence:count"
    payload: { online: number }
}

/** Alle Nachrichten, die der Server schicken kann. Neue Typen hier ergänzen. */
export type ServerMessage = PresenceCountMessage;

const SERVER_MESSAGE_TYPES: ReadonlyArray<ServerMessage["type"]> = ["presence:count"];

// ── Parsen ───────────────────────────────────────────────────────────────────

const parseTyped = <T extends { type: string }>(raw: string, types: ReadonlyArray<T["type"]>): T | null => {
    try {
        const message = JSON.parse(raw);
        if (typeof message !== "object" || message === null) return null;
        if (!types.includes(message.type)) return null;
        return message as T;
    } catch {
        return null;
    }
};

/**
 * Parst eine Textnachricht vom Server. Gibt null zurück bei kaputtem JSON oder unbekanntem type,
 * z. B. wenn das Frontend älter ist als die API.
 */
export const parseServerMessage = (raw: string): ServerMessage | null =>
    parseTyped<ServerMessage>(raw, SERVER_MESSAGE_TYPES);

/**
 * Parst eine Textnachricht vom Client (nicht den Heartbeat-Text). Gibt null zurück bei kaputtem JSON
 * oder unbekanntem type - der Server ignoriert die Nachricht dann.
 */
export const parseClientMessage = (raw: string): ClientMessage | null =>
    parseTyped<ClientMessage>(raw, CLIENT_MESSAGE_TYPES);

// ── Close-Codes ──────────────────────────────────────────────────────────────
// 4000-4999 sind für Anwendungen reserviert. Der Client liest sie im close-Event (event.code).

/** Kein oder ungültiger Token. Der Client soll NICHT automatisch neu verbinden. */
export const CLOSE_UNAUTHORIZED = 4401;
