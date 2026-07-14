// test/routes/publicRoutes/login.test.ts

jest.mock("../../../src/AppDataSource", () => {
  const { testDataSource } = require("../../helpers/testDataSource");
  return {
    AppDataSource: testDataSource,  // testDataSource-Instanz direkt
  };
});

import request from "supertest";
import app from "../../../src/app";
import { testDataSource } from "../../helpers/testDataSource";
import { createUser } from "../../factories/user.factory";

describe("POST /public/login", () => {
  beforeAll(async () => {
    await testDataSource.initialize()
  })

  afterAll(async () => {
    await testDataSource.destroy()
  })

  afterEach(async () => {
    // Tabellen nach jedem Test leeren, dropSchema macht das nur einmal beim Start
    await testDataSource.query(`TRUNCATE TABLE "user" CASCADE`)
  })


  // Erfolgreicher Login
  it("sollte 200 und einen access_token zurückgeben", async () => {
    await createUser({
      email: "max@firma.de",
      // password "Test1234!" wird in der Factory gehasht
    })

    const res = await request(app)
      .post("/api/v1/public/login")
      .send({ email: "max@firma.de", password: "Test1234!" })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.access_token).toBeDefined()
    expect(res.body.data.expires_in).toBe(6000000)
  })

  // 422 – User nicht gefunden 
  it("sollte 422 zurückgeben wenn der User nicht existiert", async () => {
    const res = await request(app)
      .post("/api/v1/public/login")
      .send({ email: "niemand@firma.de", password: "Test1234!" })

    expect(res.status).toBe(422)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe("User mit der Email konnte nicht gefunden werden.")
  })

  // 401 – Falsches Passwort
  it("sollte 401 zurückgeben bei falschem Passwort", async () => {
    await createUser({ email: "max@firma.de" })

    const res = await request(app)
      .post("/api/v1/public/login")
      .send({ email: "max@firma.de", password: "FalschesPasswort!" })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe("Ungültige Anmeldedaten.")
  })

  // 403 – User gesperrt (mehr als 5 fehlgeschlagene Versuche)
  it("sollte 403 zurückgeben wenn der User gesperrt ist", async () => {
    await createUser({
      email: "gesperrt@firma.de",
      failed_login_attempts: 6, // ← über dem Limit
    })

    const res = await request(app)
      .post("/api/v1/public/login")
      .send({ email: "gesperrt@firma.de", password: "Test1234!" })

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe("Nutzer ist gesperrt.")
  })

  // 400 – Validierungsfehler
  it("sollte 400 zurückgeben bei ungültigem Body", async () => {
    const res = await request(app)
      .post("/api/v1/public/login")
      .send({ email: "keine-email", password: "" })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe("Validation Error")
    expect(res.body.errors).toBeDefined()
  })

  // failed_login_attempts wird inkrementiert
  it("sollte failed_login_attempts nach falschem Passwort erhöhen", async () => {
    await createUser({ email: "max@firma.de" })

    await request(app)
      .post("/api/v1/public/login")
      .send({ email: "max@firma.de", password: "Falsch!" })

    const user = await testDataSource
      .getRepository("User")
      .findOneBy({ email: "max@firma.de" })

    expect(user?.failed_login_attempts).toBe(1)
  })

})