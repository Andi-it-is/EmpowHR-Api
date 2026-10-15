import app from "./app";
import { AppDataSource } from "./AppDataSource";
import { attachWebSocketServer } from "./lib/websocket/socket";

const PORT: string = process.env.PORT || "3000";

const connectToDb = async (): Promise<void> => {
    for (let counter = 0; counter < 3; counter++) {
        try {
            await AppDataSource.initialize();
            break;
        } catch (error) {
            if (counter === 2) throw error;
            console.log("could not connect to db - retry in 3 sec (" + (counter + 1) + "/3)");
            await delay(3);
        }
    }

    const env = process.env.NODE_ENV === "production" ? "MySQL (Production)" : "PostgreSQL (Development)";
    console.log(`Connection to DB successful - using ${env}`);
    console.log("Running migrations...");
    await AppDataSource.runMigrations();
    console.log(`Migrations successful | ${env} | Backend ready`)
    console.log(`|--- Api Documentation is available under localhost:${PORT}/api-docs ---|`)
};

const delay = (n: number) => new Promise(r => setTimeout(r, n * 1000));

// Erst lauschen, wenn die DB steht - sonst nimmt der Socket bereits Requests an,
// die dann auf eine nicht initialisierte DataSource laufen und ins Timeout hängen.
const start = async (): Promise<void> => {
    console.log('Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);

    await connectToDb();

    const server = app.listen(PORT, () => {
        console.log(`Backend started. Listening on port: ${PORT}`);
    });

    attachWebSocketServer(server);
};

start().catch((error) => {
    console.error("Startup fehlgeschlagen - Server wird nicht gestartet:", error);
    process.exit(1);
});

