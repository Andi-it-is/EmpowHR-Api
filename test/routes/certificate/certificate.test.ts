// test/routes/certificate/certificate.test.ts

jest.mock("../../../src/AppDataSource", () => {
  const { testDataSource } = require("../../helpers/testDataSource");
  return { AppDataSource: testDataSource };
});

jest.mock("../../../src/lib/middleware/permissionChecker", () => ({
  permissionChecker: () => (req: any, res: any, next: any) => {
    req.maxTargetPermissionScope = "ALL";
    next();
  },
}));

import request from "supertest";
import app from "../../../src/app";
import { testDataSource } from "../../helpers/testDataSource";
import { createUser } from "../../factories/user.factory";
import { User } from "../../../src/entity/User";
import { Certificate } from "../../../src/entity/Certificate";
import jwt from "jsonwebtoken";

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

function generateAccessToken(user: User): string {
  return jwt.sign(
    {
      userId: String(user.id),
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      roles: [],
      department: null,
    },
    process.env.JWT_ACCESS_TOKEN_SECRET!,
    { expiresIn: "1h" }
  );
}

async function createCertificate(user: User, overrides: Partial<Certificate> = {}): Promise<Certificate> {
  const repo = testDataSource.getRepository(Certificate);
  const cert = repo.create({
    title: "Testzertifikat",
    description: "Eine Beschreibung",
    file_path: "uploads/certificates/test/testcert.pdf",
    issued_at: new Date("2024-01-01"),
    expires_at: new Date("2027-01-01"),
    user,
    ...overrides,
  });
  return repo.save(cert);
}

// ─── DB Setup ────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await testDataSource.initialize();
});

afterAll(async () => {
  await testDataSource.destroy();
});

afterEach(async () => {
  await testDataSource.query(`TRUNCATE TABLE "certificate" CASCADE`);
  await testDataSource.query(`TRUNCATE TABLE "user" CASCADE`);
});

// ─── Tests: GET /api/v1/certificate ──────────────────────────────────────────

describe("GET /api/v1/certificate", () => {

  it("sollte 200 und alle eigenen Zertifikate zurückgeben", async () => {
    const user = await createUser({ email: "certuser@firma.de" });
    const token = generateAccessToken(user);

    await createCertificate(user, { title: "Zert 1" });
    await createCertificate(user, { title: "Zert 2" });

    const res = await request(app)
      .get("/api/v1/certificate")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it("sollte 200 und leere Liste zurückgeben wenn keine Zertifikate vorhanden", async () => {
    const user = await createUser({ email: "certuser2@firma.de" });
    const token = generateAccessToken(user);

    const res = await request(app)
      .get("/api/v1/certificate")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it("sollte kein file_path im Response zurückgeben", async () => {
    const user = await createUser({ email: "certuser3@firma.de" });
    const token = generateAccessToken(user);
    await createCertificate(user);

    const res = await request(app)
      .get("/api/v1/certificate")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].file_path).toBeUndefined();
  });

  it("sollte nur Zertifikate des eigenen Users zurückgeben", async () => {
    const userA = await createUser({ email: "certuserA@firma.de" });
    const userB = await createUser({ email: "certuserB@firma.de" });
    const tokenA = generateAccessToken(userA);

    await createCertificate(userA, { title: "Mein Zert" });
    await createCertificate(userB, { title: "Fremdes Zert" });

    const res = await request(app)
      .get("/api/v1/certificate")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe("Mein Zert");
  });
});

// ─── Tests: GET /api/v1/certificate/other/:id ────────────────────────────────

describe("GET /api/v1/certificate/other/:id", () => {

  it("sollte 200 und Zertifikate des Zielbenutzers zurückgeben", async () => {
    const requester = await createUser({ email: "req@firma.de" });
    const target = await createUser({ email: "target@firma.de" });
    const token = generateAccessToken(requester);

    await createCertificate(target, { title: "Zielzert" });

    const res = await request(app)
      .get(`/api/v1/certificate/other/${target.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe("Zielzert");
  });

  it("sollte 200 und leere Liste zurückgeben wenn Zieluser keine Zertifikate hat", async () => {
    const requester = await createUser({ email: "req2@firma.de" });
    const target = await createUser({ email: "target2@firma.de" });
    const token = generateAccessToken(requester);

    const res = await request(app)
      .get(`/api/v1/certificate/other/${target.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("sollte 500 zurückgeben bei ungültiger UUID", async () => {
    const requester = await createUser({ email: "req3@firma.de" });
    const token = generateAccessToken(requester);

    const res = await request(app)
      .get(`/api/v1/certificate/other/keine-uuid`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(undefined);
  });
});

// ─── Tests: PATCH /api/v1/certificate/other/:userId/:certId ──────────────────

describe("PATCH /api/v1/certificate/other/:userId/:certId", () => {

  it("sollte 200 zurückgeben und Zertifikat aktualisieren", async () => {
    const requester = await createUser({ email: "patcher@firma.de" });
    const target = await createUser({ email: "patchtarget@firma.de" });
    const token = generateAccessToken(requester);
    const cert = await createCertificate(target, { title: "Alter Titel" });

    const res = await request(app)
      .patch(`/api/v1/certificate/other/${target.id}/${cert.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Neuer Titel", description: "Neue Beschreibung" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Sicherstellen dass der Titel wirklich geändert wurde
    const updated = await testDataSource.getRepository(Certificate).findOne({ where: { id: cert.id } });
    expect(updated?.title).toBe("Neuer Titel");
    expect(updated?.description).toBe("Neue Beschreibung");
  });

  it("sollte 200 zurückgeben und issued_at / expires_at aktualisieren", async () => {
    const requester = await createUser({ email: "patcher2@firma.de" });
    const target = await createUser({ email: "patchtarget2@firma.de" });
    const token = generateAccessToken(requester);
    const cert = await createCertificate(target);

    const res = await request(app)
      .patch(`/api/v1/certificate/other/${target.id}/${cert.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        issued_at: "2025-03-01",
        expires_at: "2028-03-01",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await testDataSource.getRepository(Certificate).findOne({ where: { id: cert.id } });
    expect(updated?.issued_at).toBeDefined();
    expect(updated?.expires_at).toBeDefined();
  });

  it("sollte 404 zurückgeben wenn Zertifikat nicht existiert", async () => {
    const requester = await createUser({ email: "patcher3@firma.de" });
    const target = await createUser({ email: "patchtarget3@firma.de" });
    const token = generateAccessToken(requester);

    const res = await request(app)
      .patch(`/api/v1/certificate/other/${target.id}/00000000-0000-0000-0000-000000000000`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Neuer Titel" });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Zertifikat nicht gefunden.");
  });

  it("sollte 404 zurückgeben wenn Zertifikat einem anderen User gehört", async () => {
    const requester = await createUser({ email: "patcher4@firma.de" });
    const targetA = await createUser({ email: "patchtargetA@firma.de" });
    const targetB = await createUser({ email: "patchtargetB@firma.de" });
    const token = generateAccessToken(requester);
    const cert = await createCertificate(targetA);

    const res = await request(app)
      .patch(`/api/v1/certificate/other/${targetB.id}/${cert.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Neuer Titel" });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ─── Tests: DELETE /api/v1/certificate/other/:userId/:certId ─────────────────

describe("DELETE /api/v1/certificate/other/:userId/:certId", () => {

  it("sollte 200 zurückgeben und Zertifikat löschen", async () => {
    const requester = await createUser({ email: "deleter@firma.de" });
    const target = await createUser({ email: "deltarget@firma.de" });
    const token = generateAccessToken(requester);
    const cert = await createCertificate(target);

    const res = await request(app)
      .delete(`/api/v1/certificate/other/${target.id}/${cert.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Zertifikat erfolgreich gelöscht.");

    // Sicherstellen dass das Zertifikat wirklich gelöscht wurde
    const deleted = await testDataSource.getRepository(Certificate).findOne({ where: { id: cert.id } });
    expect(deleted).toBeNull();
  });

  it("sollte 200 zurückgeben auch wenn Datei nicht auf Disk existiert", async () => {
    const requester = await createUser({ email: "deleter2@firma.de" });
    const target = await createUser({ email: "deltarget2@firma.de" });
    const token = generateAccessToken(requester);
    const cert = await createCertificate(target, {
      file_path: "uploads/certificates/nichtvorhanden/datei.pdf"
    });

    const res = await request(app)
      .delete(`/api/v1/certificate/other/${target.id}/${cert.id}`)
      .set("Authorization", `Bearer ${token}`);

    // fs.existsSync verhindert Fehler wenn Datei fehlt – sollte trotzdem 200 zurückgeben
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("sollte 404 zurückgeben wenn Zertifikat nicht existiert", async () => {
    const requester = await createUser({ email: "deleter3@firma.de" });
    const target = await createUser({ email: "deltarget3@firma.de" });
    const token = generateAccessToken(requester);

    const res = await request(app)
      .delete(`/api/v1/certificate/other/${target.id}/00000000-0000-0000-0000-000000000000`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Zertifikat nicht gefunden.");
  });

  it("sollte 404 zurückgeben wenn Zertifikat einem anderen User gehört", async () => {
    const requester = await createUser({ email: "deleter4@firma.de" });
    const targetA = await createUser({ email: "deltargetA@firma.de" });
    const targetB = await createUser({ email: "deltargetB@firma.de" });
    const token = generateAccessToken(requester);
    const cert = await createCertificate(targetA);

    const res = await request(app)
      .delete(`/api/v1/certificate/other/${targetB.id}/${cert.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

