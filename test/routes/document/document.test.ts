// test/routes/document/document.test.ts

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
import { Document } from "../../../src/entity/Document";
import { DocumentType, DocumentSecurityLevel } from "../../../src/lib/enums/acessControl.enum";
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

async function createDocument(user: User, overrides: Partial<Document> = {}): Promise<Document> {
  const repo = testDataSource.getRepository(Document);
  const doc = repo.create({
    title: "Testdokument",
    type: DocumentType.CONTRACT,
    security_level: DocumentSecurityLevel.RESTRICTED,
    file_path: "uploads/documents/test/testfile.pdf",
    user,
    ...overrides,
  });
  return repo.save(doc);
}

// ─── DB Setup ────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await testDataSource.initialize();
});

afterAll(async () => {
  await testDataSource.destroy();
});

afterEach(async () => {
  await testDataSource.query(`TRUNCATE TABLE "document" CASCADE`);
  await testDataSource.query(`TRUNCATE TABLE "user" CASCADE`);
});

// ─── Tests: GET /api/v1/document/my ──────────────────────────────────────────

describe("GET /api/v1/document/my", () => {

  it("sollte 200 und alle Dokumente des Users zurückgeben", async () => {
    const user = await createUser({ email: "docuser@firma.de" });
    const token = generateAccessToken(user);

    await createDocument(user, { title: "Vertrag 1", type: DocumentType.CONTRACT });
    await createDocument(user, { title: "Vertrag 2", type: DocumentType.FINANCE });

    const res = await request(app)
      .get("/api/v1/document/my")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it("sollte kein file_path im Response zurückgeben", async () => {
    const user = await createUser({ email: "docuser2@firma.de" });
    const token = generateAccessToken(user);
    await createDocument(user);

    const res = await request(app)
      .get("/api/v1/document/my")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].file_path).toBeUndefined();
  });

  it("sollte 200 und leere Liste zurückgeben wenn keine Dokumente vorhanden", async () => {
    const user = await createUser({ email: "docuser3@firma.de" });
    const token = generateAccessToken(user);

    const res = await request(app)
      .get("/api/v1/document/my")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it("sollte nur Dokumente des eigenen Users zurückgeben", async () => {
    const userA = await createUser({ email: "docuserA@firma.de" });
    const userB = await createUser({ email: "docuserB@firma.de" });
    const tokenA = generateAccessToken(userA);

    await createDocument(userA, { title: "Mein Dok" });
    await createDocument(userB, { title: "Fremdes Dok" });

    const res = await request(app)
      .get("/api/v1/document/my")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe("Mein Dok");
  });
});

// ─── Tests: POST /api/v1/document/my/filter ──────────────────────────────────

describe("POST /api/v1/document/my/filter", () => {

  it("sollte 200 und alle Dokumente zurückgeben ohne Filter", async () => {
    const user = await createUser({ email: "filter@firma.de" });
    const token = generateAccessToken(user);

    await createDocument(user, { type: DocumentType.CONTRACT });
    await createDocument(user, { type: DocumentType.FINANCE });

    const res = await request(app)
      .post("/api/v1/document/my/filter")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it("sollte 200 und gefilterte Dokumente nach Typ zurückgeben", async () => {
    const user = await createUser({ email: "filter2@firma.de" });
    const token = generateAccessToken(user);

    await createDocument(user, { type: DocumentType.CONTRACT });
    await createDocument(user, { type: DocumentType.FINANCE });

    const res = await request(app)
      .post("/api/v1/document/my/filter")
      .set("Authorization", `Bearer ${token}`)
      .send({ type: ["CONTRACT"] });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].type).toBe("CONTRACT");
  });

  it("sollte 200 und gefilterte Dokumente nach security_level zurückgeben", async () => {
    const user = await createUser({ email: "filter3@firma.de" });
    const token = generateAccessToken(user);

    await createDocument(user, { security_level: DocumentSecurityLevel.RESTRICTED });
    await createDocument(user, { security_level: DocumentSecurityLevel.CONFIDENTIAL });

    const res = await request(app)
      .post("/api/v1/document/my/filter")
      .set("Authorization", `Bearer ${token}`)
      .send({ security_level: [DocumentSecurityLevel.RESTRICTED] });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].security_level).toBe(DocumentSecurityLevel.RESTRICTED);
  });

  it("sollte 500 zurückgeben bei ungültigem Typ-Filter", async () => {
    const user = await createUser({ email: "filter4@firma.de" });
    const token = generateAccessToken(user);

    const res = await request(app)
      .post("/api/v1/document/my/filter")
      .set("Authorization", `Bearer ${token}`)
      .send({ type: ["UNGUELTIG"] });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(undefined);
  });
});

// ─── Tests: GET /api/v1/document/other/:id ───────────────────────────────────

describe("GET /api/v1/document/other/:id", () => {

  it("sollte 200 und Dokumente des Zielbenutzers zurückgeben", async () => {
    const requester = await createUser({ email: "requester@firma.de" });
    const target = await createUser({ email: "target@firma.de" });
    const token = generateAccessToken(requester);

    await createDocument(target, { title: "Zieldok" });

    const res = await request(app)
      .get(`/api/v1/document/other/${target.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe("Zieldok");
  });

  it("sollte 200 und leere Liste zurückgeben wenn Zieluser keine Dokumente hat", async () => {
    const requester = await createUser({ email: "requester2@firma.de" });
    const target = await createUser({ email: "target2@firma.de" });
    const token = generateAccessToken(requester);

    const res = await request(app)
      .get(`/api/v1/document/other/${target.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("sollte 404 zurückgeben wenn Zieluser nicht existiert", async () => {
    const requester = await createUser({ email: "requester3@firma.de" });
    const token = generateAccessToken(requester);

    const res = await request(app)
      .get(`/api/v1/document/other/00000000-0000-0000-0000-000000000000`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("sollte 500 zurückgeben bei ungültiger UUID", async () => {
    const requester = await createUser({ email: "requester4@firma.de" });
    const token = generateAccessToken(requester);

    const res = await request(app)
      .get(`/api/v1/document/other/keine-gueltige-uuid`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(undefined);
  });
});

// ─── Tests: PATCH /api/v1/document/other/:userId/:documentId ─────────────────

describe("PATCH /api/v1/document/other/:userId/:documentId", () => {

  it("sollte 200 zurückgeben und Dokument aktualisieren", async () => {
    const requester = await createUser({ email: "patcher@firma.de" });
    const target = await createUser({ email: "patchtarget@firma.de" });
    const token = generateAccessToken(requester);
    const doc = await createDocument(target, { title: "Alter Titel" });

    const res = await request(app)
      .patch(`/api/v1/document/other/${target.id}/${doc.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Neuer Titel", type: "FINANCE" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Sicherstellen dass der Titel wirklich geändert wurde
    const updated = await testDataSource.getRepository(Document).findOne({ where: { id: doc.id } });
    expect(updated?.title).toBe("Neuer Titel");
    expect(updated?.type).toBe("FINANCE");
  });

  it("sollte 404 zurückgeben wenn Dokument nicht existiert", async () => {
    const requester = await createUser({ email: "patcher2@firma.de" });
    const target = await createUser({ email: "patchtarget2@firma.de" });
    const token = generateAccessToken(requester);

    const res = await request(app)
      .patch(`/api/v1/document/other/${target.id}/00000000-0000-0000-0000-000000000000`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Neuer Titel" });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Dokument nicht gefunden.");
  });

  it("sollte 500 zurückgeben bei ungültigem type-Wert", async () => {
    const requester = await createUser({ email: "patcher3@firma.de" });
    const target = await createUser({ email: "patchtarget3@firma.de" });
    const token = generateAccessToken(requester);
    const doc = await createDocument(target);

    const res = await request(app)
      .patch(`/api/v1/document/other/${target.id}/${doc.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "UNGUELTIG" });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(undefined);
  });
});

// ─── Tests: DELETE /api/v1/document/other/:userId/:documentId ────────────────

describe("DELETE /api/v1/document/other/:userId/:documentId", () => {

  it("sollte 200 zurückgeben und Dokument löschen", async () => {
    const requester = await createUser({ email: "deleter@firma.de" });
    const target = await createUser({ email: "deltarget@firma.de" });
    const token = generateAccessToken(requester);
    const doc = await createDocument(target);

    const res = await request(app)
      .delete(`/api/v1/document/other/${target.id}/${doc.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Sicherstellen dass das Dokument wirklich gelöscht wurde
    const deleted = await testDataSource.getRepository(Document).findOne({ where: { id: doc.id } });
    expect(deleted).toBeNull();
  });

  it("sollte 404 zurückgeben wenn Dokument nicht existiert", async () => {
    const requester = await createUser({ email: "deleter2@firma.de" });
    const target = await createUser({ email: "deltarget2@firma.de" });
    const token = generateAccessToken(requester);

    const res = await request(app)
      .delete(`/api/v1/document/other/${target.id}/00000000-0000-0000-0000-000000000000`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Dokument nicht gefunden.");
  });

  it("sollte 404 zurückgeben wenn Dokument einem anderen User gehört", async () => {
    const requester = await createUser({ email: "deleter3@firma.de" });
    const targetA = await createUser({ email: "deltargetA@firma.de" });
    const targetB = await createUser({ email: "deltargetB@firma.de" });
    const token = generateAccessToken(requester);
    const doc = await createDocument(targetA); // Dokument gehört targetA

    const res = await request(app)
      .delete(`/api/v1/document/other/${targetB.id}/${doc.id}`) // aber targetB wird angegeben
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

