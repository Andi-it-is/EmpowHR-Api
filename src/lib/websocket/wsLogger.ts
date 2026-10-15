/**
 * Logging für WebSocket-Verbindungen.
 * morgan sieht WebSockets nicht, weil der Handshake an Express vorbeiläuft - daher eigenes Logging.
 * Format angelehnt an das morgan-Format aus app.ts, im Testmodus stumm wie morgan.
 */
export const wsLog = (message: string): void => {
    if (process.env.NODE_ENV === "test") return;
    console.log(`${new Date().toISOString()} - WS - ${message}`);
};
