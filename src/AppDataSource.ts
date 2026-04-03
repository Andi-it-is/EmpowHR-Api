import "reflect-metadata"
import { DataSource } from "typeorm"
import * as dotenv from "dotenv"
dotenv.config()

const isProduction = process.env.NODE_ENV === "production"

export const AppDataSource = new DataSource({
    type: isProduction ? "mysql" : "postgres",
    host: process.env.DB_HOST || "127.0.0.1",
    port: isProduction ? 3306 : 5432,
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASS || "postgres?!?",
    database: process.env.DB_NAME || "dev_empowhr",

    synchronize: false,
    logging: false,
    migrationsRun: true,

    entities: [__dirname + "/entity/*.{js,ts}"],
    migrations: [
        __dirname + `/migration/${isProduction ? 'mysql' : 'postgres'}/*.{js,ts}`
    ],
    subscribers: [__dirname + "/lib/subscribers/*.{js,ts}"],
})