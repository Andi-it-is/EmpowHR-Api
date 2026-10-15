import { IncomingMessage, Server } from "http";
import { Duplex } from "stream";
import * as jwt from "jsonwebtoken";
import { WebSocketServer } from "ws";
import { User } from "../../entity/User";
import { verifyAccessToken } from "../helpers/verifyAccessToken";
import { registerPresence } from "./presence";
import { registerHeartbeat } from "./heartbeat";
import { CLOSE_UNAUTHORIZED } from "./messages";
import { wsLog } from "./wsLogger";

const WS_PATH = "/api/v1/ws";

// Clients schicken nur "ping" und kleine JSON-Nachrichten (presence:activity) - der Standard von 100 MiB ist unnötig groß
const MAX_PAYLOAD_BYTES = 4 * 1024;

const ACCESS_TOKEN_COOKIE = "access_token";

/**
 * Liest ein Cookie aus dem rohen cookie-Header.
 * cookie-parser greift hier nicht, weil der Handshake nicht durch Express läuft.
 */
const getCookie = (req: IncomingMessage, name: string): string | undefined => {
    const header = req.headers.cookie;
    if (!header) return undefined;

    for (const part of header.split(";")) {
        const index = part.indexOf("=");
        if (index === -1) continue;
        if (part.slice(0, index).trim() !== name) continue;

        const value = part.slice(index + 1).trim();
        try {
            return decodeURIComponent(value);
        } catch {
            return value;
        }
    }
    return undefined;
};

/**
 * Browser wenden CORS nicht auf WebSockets an - die cors()-Konfiguration schützt den Endpunkt nicht.
 * Deshalb wird der Origin hier selbst gegen CORS_ORIGIN geprüft.
 */
const isAllowedOrigin = (req: IncomingMessage): boolean => {
    const allowed = process.env.CORS_ORIGIN;
    return !!allowed && req.headers.origin === allowed;
};

type AuthResult =
    | { ok: true, user: User }
    // serverError: Fehler lag beim Server (z. B. DB weg), nicht am Token
    | { ok: false, reason: string, serverError: boolean };

/**
 * Prüft den Token aus dem access_token-Cookie.
 * Nie als Query-Parameter übergeben - der landet sonst im Access-Log des Reverse Proxys.
 */
const authenticate = async (req: IncomingMessage): Promise<AuthResult> => {
    const token = getCookie(req, ACCESS_TOKEN_COOKIE);
    if (!token) return { ok: false, reason: "kein Token", serverError: false };

    try {
        const user = await verifyAccessToken(token);
        if (!user) return { ok: false, reason: "User nicht gefunden", serverError: false };
        return { ok: true, user };
    } catch (error) {
        // JsonWebTokenError deckt auch TokenExpiredError und NotBeforeError ab
        if (error instanceof jwt.JsonWebTokenError) {
            return { ok: false, reason: `Token ungültig (${error.message})`, serverError: false };
        }
        return { ok: false, reason: `Fehler bei der Prüfung (${(error as Error).message})`, serverError: true };
    }
};

const rejectHandshake = (socket: Duplex, status: string): void => {
    socket.write(`HTTP/1.1 ${status}\r\nConnection: close\r\n\r\n`);
    socket.destroy();
};

/**
 * Führt den Handshake von HTTP zu WebSocket durch.
 *
 * Ablauf aus Sicht des Protokolls:
 * 1. Der Browser schickt einen normalen HTTP-GET, aber mit Zusatz-Headern:
 *      GET /api/v1/ws HTTP/1.1
 *      Upgrade: websocket
 *      Connection: Upgrade
 *      Sec-WebSocket-Key: <zufälliger Base64-Wert>
 *      Sec-WebSocket-Version: 13
 *      Origin: https://empowhr.andreasivanov.de   (setzt der Browser selbst, nicht fälschbar per JS)
 *      Cookie: access_token=...                   (schickt der Browser automatisch mit)
 * 2. Node erkennt den Upgrade-Header und löst statt "request" das Event "upgrade" aus.
 *    Express (und damit cors, cookie-parser, morgan) bekommt den Request nie zu sehen.
 * 3. Wir erhalten den rohen TCP-Socket. Bis zum Upgrade sprechen wir darauf noch HTTP,
 *    können also selbst eine HTTP-Antwort als Text hineinschreiben (siehe rejectHandshake).
 * 4. ws.handleUpgrade antwortet mit "HTTP/1.1 101 Switching Protocols".
 *    Ab da läuft über dieselbe TCP-Verbindung kein HTTP mehr, sondern WebSocket-Frames.
 */
const handleUpgrade = async (wss: WebSocketServer, req: IncomingMessage, socket: Duplex, head: Buffer): Promise<void> => {
    // ── 1. Pfad prüfen ───────────────────────────────────────────────────────
    // req.url enthält nur Pfad + Query (z. B. "/api/v1/ws?x=1"), die Basis-URL ist nur
    // nötig, damit new URL() parsen kann. Verglichen wird nur der Pfad, die Query ist egal.
    const { pathname } = new URL(req.url ?? "", "http://localhost");

    // Alle Upgrade-Requests landen hier, auch auf fremden Pfaden.
    // Die bekommen gar keine Antwort - die TCP-Verbindung wird einfach getrennt.
    if (pathname !== WS_PATH) {
        socket.destroy();
        return;
    }

    // ── 2. Origin prüfen (noch HTTP) ─────────────────────────────────────────
    // Schutz gegen Cross-Site WebSocket Hijacking: Eine fremde Seite könnte sonst eine
    // Verbindung öffnen, und der Browser würde unser Cookie mitschicken.
    // Nicht-Browser-Clients (curl, Skripte) können Origin frei setzen - sie brauchen aber
    // trotzdem einen gültigen Token, den eine fremde Webseite nicht auslesen kann.
    // Hier sind wir noch im HTTP-Teil, deshalb eine echte HTTP-Antwort (403).
    // Der Browser sieht davon nur ein error-Event und Close-Code 1006 - das ist ok,
    // eine fremde Seite soll ohnehin nicht erfahren, warum es nicht klappt.
    if (!isAllowedOrigin(req)) {
        wsLog(`Handshake abgelehnt (Origin) - origin=${req.headers.origin ?? "keiner"}`);
        rejectHandshake(socket, "403 Forbidden");
        return;
    }

    // ── 3. Token prüfen (noch HTTP, asynchron) ───────────────────────────────
    // Während der DB-Abfrage kann der Client abbrechen - ohne Listener würde das den Prozess beenden
    const onSocketError = (error: Error) => {
        console.error("WebSocket upgrade socket error:", error.message);
    };
    socket.on("error", onSocketError);

    // Liest das access_token-Cookie und lädt den User. ok = false -> reason sagt, warum.
    const auth = await authenticate(req);

    // Ab handleUpgrade übernimmt ws die Fehlerbehandlung des Sockets
    socket.off("error", onSocketError);

    // "=== false" statt "!auth.ok": ohne strictNullChecks (tsconfig) grenzt TS den Typ nur so ein
    if (auth.ok === false) {
        if (auth.serverError) {
            console.error(`${new Date().toISOString()} - WS - Handshake fehlgeschlagen (Server) - ${auth.reason}`);
        } else {
            wsLog(`Handshake abgelehnt (Token: ${auth.reason})`);
        }
    }

    // ── 4. Upgrade auf WebSocket ─────────────────────────────────────────────
    // handleUpgrade prüft die Pflicht-Header (Upgrade, Sec-WebSocket-Key, -Version) und
    // lehnt kaputte Handshakes selbst mit einem HTTP-Fehler ab (z. B. 400).
    // Sonst berechnet es Sec-WebSocket-Accept = Base64(SHA-1(Key + feste GUID)) und schickt
    // "101 Switching Protocols". Damit beweist der Server, dass er WebSocket wirklich versteht.
    // Hat der Client die Verbindung während Schritt 3 schon getrennt, wird der Callback nie aufgerufen.
    //
    // head: Bytes, die zusammen mit den Headern im selben TCP-Paket kamen.
    // Meist leer, wird aber durchgereicht, damit keine Daten verloren gehen.
    wss.handleUpgrade(req, socket, head, (ws) => {
        // Ab hier ist die Verbindung ein WebSocket - kein HTTP mehr möglich.

        // Ohne error-Listener reißt z. B. eine zu große Nachricht (maxPayload) den ganzen Prozess mit
        ws.on("error", (error) => {
            console.error("WebSocket error:", error.message);
        });

        // ── 5a. Nicht authentifiziert: annehmen und sofort schließen ─────────
        // Kein oder ungültiger Token: annehmen und sofort mit 4401 schließen.
        // Ein abgelehnter Handshake sähe für den Browser nur wie ein Netzwerkfehler (1006) aus.
        // Ein Close-Frame mit Code 4401 kommt dagegen im close-Event beim Client an (event.code),
        // der daraufhin aufhört, neu zu verbinden.
        // Bei einem Serverfehler (z. B. DB kurz weg) dagegen 1011: Der Token ist evtl. gültig,
        // der Client soll es später erneut versuchen statt dauerhaft aufzugeben.
        if (auth.ok === false) {
            if (auth.serverError) {
                ws.close(1011, "Internal Error");
            } else {
                ws.close(CLOSE_UNAUTHORIZED, "Unauthorized");
            }
            return;
        }

        // ── 5b. Authentifiziert: an die Anwendungslogik übergeben ────────────
        const user = auth.user;
        const connectedAt = Date.now();
        // Nur die User-ID - keine personenbezogenen Daten (E-Mail, Name, IP) im Log
        const who = `user=${user.id}`;
        wsLog(`Verbunden - ${who}`);

        ws.on("close", (code: number) => {
            const seconds = Math.round((Date.now() - connectedAt) / 1000);
            wsLog(`Getrennt - ${who} - Code ${code} - Dauer ${seconds} s`);
        });

        // Gleiches Muster wie in der ws-Doku: "connection" selbst auslösen und den User mitgeben.
        wss.emit("connection", ws, req, user);
    });
};

/**
 * Hängt den WebSocket-Server an den laufenden HTTP-Server.
 * Nur aus start() in index.ts aufrufen, nicht in app.ts - sonst laufen die Tests mit.
 *
 * Authentifizierte Verbindungen lösen "connection" mit (ws, req, user) aus.
 */
export const attachWebSocketServer = (server: Server): WebSocketServer => {
    const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_PAYLOAD_BYTES });

    // Online-Status: reagiert auf "connection" (nur authentifizierte Verbindungen)
    registerPresence(wss);

    // Heartbeat: tote Verbindungen erkennen + "ping" vom Client beantworten
    registerHeartbeat(wss);

    // Sobald ein upgrade-Listener existiert, landen alle Upgrade-Requests hier und nicht bei Express
    server.on("upgrade", (req, socket, head) => {
        // async-Handler: ein Fehler wäre sonst eine Unhandled Rejection und beendet den Prozess
        handleUpgrade(wss, req, socket, head).catch((error) => {
            console.error("WebSocket upgrade failed:", error);
            socket.destroy();
        });
    });

    return wss;
};
