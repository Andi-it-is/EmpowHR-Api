// src/index.ts
import app from "./app";
import { AppDataSource } from "./AppDataSource";

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

app.listen(PORT, async () => {
    console.log('Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    await connectToDb();
    console.log(`Backend started. Listening on port: ${PORT}`);
});