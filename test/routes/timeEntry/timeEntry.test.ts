// test/routes/timeEntry/timeEntry.test.ts

jest.mock("../../../src/AppDataSource", () => {
  const { testDataSource } = require("../../helpers/testDataSource");
  return {
    AppDataSource: testDataSource,
  };
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
import { UserTimeAccount } from "../../../src/entity/UserTimeAccount";
import { TimeEntry } from "../../../src/entity/TimeEntry";
import { TimeEntryType, WorkingLocation } from "../../../src/lib/enums/timeRecording.enum";
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

async function createTimeAccount(user: User, overrides: Partial<UserTimeAccount> = {}): Promise<UserTimeAccount> {
  const repo = testDataSource.getRepository(UserTimeAccount);
  const account = repo.create({
    contract_hours_per_week: 40,
    working_days_per_week: 5,
    vacation_days_per_year: 30,
    delta_hours: 0,
    valid_from: new Date("2024-01-01"),
    user,
    ...overrides,
  });
  return repo.save(account);
}

async function createTimeEntry(timeAccount: UserTimeAccount, overrides: Partial<TimeEntry> = {}): Promise<TimeEntry> {
  const repo = testDataSource.getRepository(TimeEntry);
  const entry = repo.create({
    start_date: new Date("2025-01-15T09:00:00.000Z"),
    end_date: new Date("2025-01-15T17:00:00.000Z"),
    working_location: WorkingLocation.OFFICE,
    type: TimeEntryType.WORK,
    interruption_hours: 0.5,
    recorded_hours: 7.5,
    is_confirmed: true,
    time_account: timeAccount,
    ...overrides,
  });
  return repo.save(entry);
}

// ─── DB Setup ────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await testDataSource.initialize();
});

afterAll(async () => {
  await testDataSource.destroy();
});

afterEach(async () => {
  await testDataSource.query(`TRUNCATE TABLE "time_entry" CASCADE`);
  await testDataSource.query(`TRUNCATE TABLE "user_time_account" CASCADE`);
  await testDataSource.query(`TRUNCATE TABLE "user" CASCADE`);
});

// ─── Tests: POST /api/v1/timeEntry/my/create ─────────────────────────────────

describe("POST /api/v1/timeEntry/my/create", () => {

  it("sollte 201 zurückgeben und Zeiteintrag erstellen (WORK, OFFICE)", async () => {
    const user = await createUser({ email: "worker@firma.de" });
    await createTimeAccount(user);
    const token = generateAccessToken(user);

    const res = await request(app)
      .post("/api/v1/timeEntry/my/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        start_date: "2025-03-10T08:00:00.000Z",
        end_date: "2025-03-10T16:00:00.000Z",
        working_location: "OFFICE",
        type: "WORK",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.working_location).toBe("OFFICE");
    expect(res.body.data.type).toBe("WORK");
    expect(res.body.data.is_confirmed).toBe(true);
    expect(res.body.data.recorded_hours).toBeDefined();
    expect(res.body.data.interruption_hours).toBeDefined();
  });

  it("sollte 400 zurückgeben wenn Enddatum vor Startdatum liegt", async () => {
    const user = await createUser({ email: "worker2@firma.de" });
    await createTimeAccount(user);
    const token = generateAccessToken(user);

    const res = await request(app)
      .post("/api/v1/timeEntry/my/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        start_date: "2025-03-10T16:00:00.000Z",
        end_date: "2025-03-10T08:00:00.000Z",
        working_location: "OFFICE",
        type: "WORK",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Das Enddatum muss nach dem Startdatum liegen.");
  });

  it("sollte 422 zurückgeben wenn Arbeitszeit über 10h45min liegt", async () => {
    const user = await createUser({ email: "worker3@firma.de" });
    await createTimeAccount(user);
    const token = generateAccessToken(user);

    const res = await request(app)
      .post("/api/v1/timeEntry/my/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        start_date: "2025-03-10T06:00:00.000Z",
        end_date: "2025-03-10T17:00:00.000Z", // 11h
        working_location: "OFFICE",
        type: "WORK",
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Ein Arbeitstag darf maximal 10 Stunden und 45 Minuten umfassen (§3 ArbZG).");
  });

  it("sollte 409 zurückgeben wenn sich Zeitraum mit bestehendem Eintrag überschneidet", async () => {
    const user = await createUser({ email: "worker4@firma.de" });
    const account = await createTimeAccount(user);
    const token = generateAccessToken(user);

    // Bestehenden Eintrag anlegen
    await createTimeEntry(account, {
      start_date: new Date("2025-03-10T08:00:00.000Z"),
      end_date: new Date("2025-03-10T16:00:00.000Z"),
    });

    const res = await request(app)
      .post("/api/v1/timeEntry/my/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        start_date: "2025-03-10T10:00:00.000Z",
        end_date: "2025-03-10T14:00:00.000Z",
        working_location: "OFFICE",
        type: "WORK",
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Der Zeitraum überschneidet sich mit einem bestehenden Eintrag.");
  });

  it("sollte 404 zurückgeben wenn kein Zeitkonto vorhanden ist", async () => {
    const user = await createUser({ email: "nokonto@firma.de" });
    // kein Zeitkonto anlegen
    const token = generateAccessToken(user);

    const res = await request(app)
      .post("/api/v1/timeEntry/my/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        start_date: "2025-03-10T08:00:00.000Z",
        end_date: "2025-03-10T16:00:00.000Z",
        working_location: "OFFICE",
        type: "WORK",
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Kein Zeitkonto für diesen Benutzer gefunden.");
  });

  it("sollte 400 zurückgeben wenn VACATION nicht ganztägig gebucht wird", async () => {
    const user = await createUser({ email: "vacation@firma.de" });
    await createTimeAccount(user);
    const token = generateAccessToken(user);

    const res = await request(app)
      .post("/api/v1/timeEntry/my/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        start_date: "2027-06-10T09:00:00.000Z",
        end_date: "2027-06-10T17:00:00.000Z",
        working_location: null,
        type: "VACATION",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Dieser Abwesenheitstyp kann nur ganztägig gebucht werden.");
  });

  it("sollte 400 zurückgeben wenn VACATION in der Vergangenheit liegt", async () => {
    const user = await createUser({ email: "vacation2@firma.de" });
    await createTimeAccount(user);
    const token = generateAccessToken(user);

    const res = await request(app)
      .post("/api/v1/timeEntry/my/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        start_date: "2024-01-01T23:00:00.000Z",
        end_date: "2024-01-02T22:59:00.000Z",
        working_location: null,
        type: "VACATION",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Urlaubseinträge können nicht in der Vergangenheit erstellt werden.");
  });
});

// ─── Tests: DELETE /api/v1/timeEntry/my/:id ──────────────────────────────────

describe("DELETE /api/v1/timeEntry/my/:id", () => {

  it("sollte 200 zurückgeben und Zeiteintrag löschen", async () => {
    const user = await createUser({ email: "delete@firma.de" });
    const account = await createTimeAccount(user);
    const token = generateAccessToken(user);
    const entry = await createTimeEntry(account);

    const res = await request(app)
      .delete(`/api/v1/timeEntry/my/${entry.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Zeiteintrag erfolgreich gelöscht.");

    // Sicherstellen dass der Eintrag wirklich weg ist
    const deleted = await testDataSource.getRepository(TimeEntry).findOne({ where: { id: entry.id } });
    expect(deleted).toBeNull();
  });

  it("sollte 404 zurückgeben wenn Zeiteintrag nicht existiert", async () => {
    const user = await createUser({ email: "delete2@firma.de" });
    await createTimeAccount(user);
    const token = generateAccessToken(user);

    const res = await request(app)
      .delete(`/api/v1/timeEntry/my/00000000-0000-0000-0000-000000000000`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("sollte 404 zurückgeben wenn Zeiteintrag einem anderen User gehört", async () => {
    const userA = await createUser({ email: "ownerA@firma.de" });
    const userB = await createUser({ email: "ownerB@firma.de" });
    const accountA = await createTimeAccount(userA);
    await createTimeAccount(userB);
    const tokenB = generateAccessToken(userB);
    const entry = await createTimeEntry(accountA); // Eintrag gehört User A

    const res = await request(app)
      .delete(`/api/v1/timeEntry/my/${entry.id}`)
      .set("Authorization", `Bearer ${tokenB}`); // User B versucht zu löschen

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ─── Tests: PATCH /api/v1/timeEntry/my/:id ───────────────────────────────────

describe("PATCH /api/v1/timeEntry/my/:id", () => {

  it("sollte 200 zurückgeben und Zeiteintrag aktualisieren", async () => {
    const user = await createUser({ email: "update@firma.de" });
    const account = await createTimeAccount(user);
    const token = generateAccessToken(user);
    const entry = await createTimeEntry(account, {
      start_date: new Date("2025-02-10T08:00:00.000Z"),
      end_date: new Date("2025-02-10T16:00:00.000Z"),
    });

    const res = await request(app)
      .patch(`/api/v1/timeEntry/my/${entry.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        start_date: "2025-02-10T09:00:00.000Z",
        end_date: "2025-02-10T17:00:00.000Z",
        working_location: "REMOTE",
        type: "WORK",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.working_location).toBe("REMOTE");
  });

  it("sollte 400 zurückgeben wenn Enddatum vor Startdatum liegt", async () => {
    const user = await createUser({ email: "update2@firma.de" });
    const account = await createTimeAccount(user);
    const token = generateAccessToken(user);
    const entry = await createTimeEntry(account);

    const res = await request(app)
      .patch(`/api/v1/timeEntry/my/${entry.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        start_date: "2025-02-10T17:00:00.000Z",
        end_date: "2025-02-10T09:00:00.000Z",
        working_location: "OFFICE",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Das Enddatum muss nach dem Startdatum liegen.");
  });

  it("sollte 409 zurückgeben wenn Zeitraum mit anderem Eintrag kollidiert", async () => {
    const user = await createUser({ email: "update3@firma.de" });
    const account = await createTimeAccount(user);
    const token = generateAccessToken(user);

    // Zwei Einträge an verschiedenen Tagen
    const entry1 = await createTimeEntry(account, {
      start_date: new Date("2025-02-10T08:00:00.000Z"),
      end_date: new Date("2025-02-10T16:00:00.000Z"),
    });
    await createTimeEntry(account, {
      start_date: new Date("2025-02-11T08:00:00.000Z"),
      end_date: new Date("2025-02-11T16:00:00.000Z"),
    });

    // entry1 auf den gleichen Zeitraum wie entry2 verschieben
    const res = await request(app)
      .patch(`/api/v1/timeEntry/my/${entry1.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        start_date: "2025-02-11T09:00:00.000Z",
        end_date: "2025-02-11T15:00:00.000Z",
        working_location: "OFFICE",
        type: "WORK",
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Der Zeitraum überschneidet sich mit einem bestehenden Eintrag.");
  });

  it("sollte 404 zurückgeben wenn Zeiteintrag nicht existiert", async () => {
    const user = await createUser({ email: "update4@firma.de" });
    await createTimeAccount(user);
    const token = generateAccessToken(user);

    const res = await request(app)
      .patch(`/api/v1/timeEntry/my/00000000-0000-0000-0000-000000000000`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        start_date: "2025-02-10T09:00:00.000Z",
        end_date: "2025-02-10T17:00:00.000Z",
        working_location: "OFFICE",
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ─── Tests: POST /api/v1/timeEntry/my/filter ─────────────────────────────────

describe("POST /api/v1/timeEntry/my/filter", () => {

  it("sollte 200 und alle Einträge zurückgeben (kein Filter)", async () => {
    const user = await createUser({ email: "filter@firma.de" });
    const account = await createTimeAccount(user);
    const token = generateAccessToken(user);

    await createTimeEntry(account, {
      start_date: new Date("2025-01-10T08:00:00.000Z"),
      end_date: new Date("2025-01-10T16:00:00.000Z"),
    });
    await createTimeEntry(account, {
      start_date: new Date("2025-01-11T08:00:00.000Z"),
      end_date: new Date("2025-01-11T16:00:00.000Z"),
    });

    const res = await request(app)
      .post("/api/v1/timeEntry/my/filter")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it("sollte 200 und gefilterte Einträge nach Typ zurückgeben", async () => {
    const user = await createUser({ email: "filter2@firma.de" });
    const account = await createTimeAccount(user);
    const token = generateAccessToken(user);

    await createTimeEntry(account, {
      start_date: new Date("2025-01-10T08:00:00.000Z"),
      end_date: new Date("2025-01-10T16:00:00.000Z"),
      type: TimeEntryType.WORK,
    });
    await createTimeEntry(account, {
      start_date: new Date("2025-01-11T00:00:00.000Z"),
      end_date: new Date("2025-01-11T23:59:00.000Z"),
      type: TimeEntryType.SICK,
    });

    const res = await request(app)
      .post("/api/v1/timeEntry/my/filter")
      .set("Authorization", `Bearer ${token}`)
      .send({ type: ["SICK"] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].type).toBe("SICK");
  });

  it("sollte 200 zurückgeben und leere Liste wenn keine Einträge vorhanden", async () => {
    const user = await createUser({ email: "filter3@firma.de" });
    await createTimeAccount(user);
    const token = generateAccessToken(user);

    const res = await request(app)
      .post("/api/v1/timeEntry/my/filter")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it("sollte shouldWorkHoursPerDay und vacationDaysPerYear zurückgeben", async () => {
    const user = await createUser({ email: "filter4@firma.de" });
    await createTimeAccount(user, {
      contract_hours_per_week: 40,
      working_days_per_week: 5,
      vacation_days_per_year: 28,
    });
    const token = generateAccessToken(user);

    const res = await request(app)
      .post("/api/v1/timeEntry/my/filter")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.shouldWorkHoursPerDay).toBe(8); // 40h / 5 Tage
    expect(res.body.vacationDaysPerYear).toBe(28);
  });
});

// ─── Tests: PATCH /api/v1/timeEntry/:id/confirmation ─────────────────────────

describe("PATCH /api/v1/timeEntry/:id/confirmation", () => {

  it("sollte 200 zurückgeben und is_confirmed auf true setzen", async () => {
    const user = await createUser({ email: "confirm@firma.de" });
    const account = await createTimeAccount(user);
    const token = generateAccessToken(user);
    const entry = await createTimeEntry(account, { is_confirmed: false });

    const res = await request(app)
      .patch(`/api/v1/timeEntry/${entry.id}/confirmation`)
      .set("Authorization", `Bearer ${token}`)
      .send({ is_confirmed: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.is_confirmed).toBe(true);
    expect(res.body.data.id).toBe(entry.id);
  });

  it("sollte 200 zurückgeben und is_confirmed auf false setzen", async () => {
    const user = await createUser({ email: "confirm2@firma.de" });
    const account = await createTimeAccount(user);
    const token = generateAccessToken(user);
    const entry = await createTimeEntry(account, { is_confirmed: true });

    const res = await request(app)
      .patch(`/api/v1/timeEntry/${entry.id}/confirmation`)
      .set("Authorization", `Bearer ${token}`)
      .send({ is_confirmed: false });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.is_confirmed).toBe(false);
  });

  it("sollte 404 zurückgeben wenn Zeiteintrag nicht existiert", async () => {
    const user = await createUser({ email: "confirm3@firma.de" });
    await createTimeAccount(user);
    const token = generateAccessToken(user);

    const res = await request(app)
      .patch(`/api/v1/timeEntry/00000000-0000-0000-0000-000000000000/confirmation`)
      .set("Authorization", `Bearer ${token}`)
      .send({ is_confirmed: true });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Zeiteintrag nicht gefunden.");
  });

  it("sollte 400 zurückgeben wenn is_confirmed fehlt im Body", async () => {
    const user = await createUser({ email: "confirm4@firma.de" });
    const account = await createTimeAccount(user);
    const token = generateAccessToken(user);
    const entry = await createTimeEntry(account);

    const res = await request(app)
      .patch(`/api/v1/timeEntry/${entry.id}/confirmation`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});