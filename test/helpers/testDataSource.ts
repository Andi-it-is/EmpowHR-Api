import "reflect-metadata"
import { DataSource } from "typeorm"
import * as path from "path"

export const testDataSource = new DataSource({
  type: "postgres",
  host: process.env.HOST,
  port: 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,

  synchronize: true,
  migrationsRun: false,
  dropSchema: true,
  logging: false,

  entities: [path.join(__dirname, "../../src/entity/*.{js,ts}")],
  subscribers: [path.join(__dirname, "../../src/lib/subscribers/*.{js,ts}")],
})