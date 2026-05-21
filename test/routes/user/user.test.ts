// test/routes/user/user.test.ts

jest.mock("../../../src/AppDataSource", () => {
  const { testDataSource } = require("../../helpers/testDataSource");
  return {
    AppDataSource: testDataSource,
  };
});

import request from "supertest";
import app from "../../../src/app";
import { testDataSource } from "../../helpers/testDataSource";
import { createUser } from "../../factories/user.factory";
import jwt from "jsonwebtoken";

// ─── Hilfsfunktion: gültiges JWT erzeugen ────────────────────────────────────
// Muss zu userTokenChecker passen: Payload-Feld ist "userId" (string)

function generateAccessToken(userId: string | number): string {
  return jwt.sign(
    {
      userId: String(userId),
      firstname: "Test",
      lastname: "User",
      email: "test@example.com",
      roles: [],
      department: null,
    },
    process.env.JWT_ACCESS_TOKEN_SECRET!,
    { expiresIn: "1h" }
  );
}

// ─── DB Setup ────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await testDataSource.initialize();
});

afterAll(async () => {
  await testDataSource.destroy();
});

afterEach(async () => {
  await testDataSource.query(`TRUNCATE TABLE "user" CASCADE`);
});

// ─── Tests: GET /api/v1/user/simple ──────────────────────────────────────────

describe("GET /api/v1/user/simple", () => {

  // ── Happy Path ──────────────────────────────────────────────────────────────

  it("sollte 200 und firstname, lastname, email zurückgeben bei gültigem Token", async () => {
    const user = await createUser({
      firstname: "Anna",
      lastname: "Beispiel",
      email: "anna@firma.de",
    });

    const token = generateAccessToken(user.id);

    const res = await request(app)
      .get("/api/v1/user/simple")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      firstname: "Anna",
      lastname: "Beispiel",
      email: "anna@firma.de",
    });
  });

  it("sollte kein password_hash oder andere sensible Felder zurückgeben", async () => {
    const user = await createUser({ email: "secure@firma.de" });
    const token = generateAccessToken(user.id);

    const res = await request(app)
      .get("/api/v1/user/simple")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.password_hash).toBeUndefined();
    expect(res.body.data.failed_login_attempts).toBeUndefined();
    expect(res.body.data.disabled).toBeUndefined();
  });

  // ── 401 – User im Token existiert nicht in DB ───────────────────────────────

  it("sollte 401 zurückgeben wenn userId im Token nicht in der DB existiert", async () => {
    const ghostToken = generateAccessToken(999999999);

    const res = await request(app)
      .get("/api/v1/user/simple")
      .set("Authorization", `Bearer ${ghostToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Provided Token could not be authorized");
  });

  // ── 401 – Auth Fehler ───────────────────────────────────────────────────────

  it("sollte 401 zurückgeben wenn kein Authorization-Header mitgeschickt wird", async () => {
    const res = await request(app).get("/api/v1/user/simple");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("No token provided");
  });

  it("sollte 401 zurückgeben wenn der Token ungültig ist", async () => {
    const res = await request(app)
      .get("/api/v1/user/simple")
      .set("Authorization", "Bearer dieser.token.istungueltig");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Provided Token could not be authorized");
  });

  it("sollte 401 zurückgeben wenn der Token abgelaufen ist", async () => {
    const user = await createUser({ email: "expired@firma.de" });
    const expiredToken = jwt.sign(
      { userId: String(user.id), roles: [], department: null },
      process.env.JWT_ACCESS_TOKEN_SECRET!,
      { expiresIn: "0s" }
    );

    const res = await request(app)
      .get("/api/v1/user/simple")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("sollte 401 zurückgeben wenn Bearer fehlt (nur Token ohne Prefix)", async () => {
    const user = await createUser({ email: "nobearer@firma.de" });
    const token = generateAccessToken(user.id);

    const res = await request(app)
      .get("/api/v1/user/simple")
      .set("Authorization", token); // kein "Bearer " davor

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("No token provided");
  });
});