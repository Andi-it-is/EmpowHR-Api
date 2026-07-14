"use strict";
// test/routes/publicRoutes/login.test.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock("../../../src/AppDataSource", () => {
    const { testDataSource } = require("../../helpers/testDataSource");
    return {
        AppDataSource: testDataSource, // testDataSource-Instanz direkt
    };
});
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const testDataSource_1 = require("../../helpers/testDataSource");
const user_factory_1 = require("../../factories/user.factory");
describe("POST /public/login", () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield testDataSource_1.testDataSource.initialize();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield testDataSource_1.testDataSource.destroy();
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Tabellen nach jedem Test leeren, dropSchema macht das nur einmal beim Start
        yield testDataSource_1.testDataSource.query(`TRUNCATE TABLE "user" CASCADE`);
    }));
    // Erfolgreicher Login
    it("sollte 200 und einen access_token zurückgeben", () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, user_factory_1.createUser)({
            email: "max@firma.de",
            // password "Test1234!" wird in der Factory gehasht
        });
        const res = yield (0, supertest_1.default)(app_1.default)
            .post("/api/v1/public/login")
            .send({ email: "max@firma.de", password: "Test1234!" });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.access_token).toBeDefined();
        expect(res.body.data.expires_in).toBe(6000000);
    }));
    // 422 – User nicht gefunden
    it("sollte 422 zurückgeben wenn der User nicht existiert", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app_1.default)
            .post("/api/v1/public/login")
            .send({ email: "niemand@firma.de", password: "Test1234!" });
        expect(res.status).toBe(422);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("User mit der Email konnte nicht gefunden werden.");
    }));
    // 401 – Falsches Passwort
    it("sollte 401 zurückgeben bei falschem Passwort", () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, user_factory_1.createUser)({ email: "max@firma.de" });
        const res = yield (0, supertest_1.default)(app_1.default)
            .post("/api/v1/public/login")
            .send({ email: "max@firma.de", password: "FalschesPasswort!" });
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Ungültige Anmeldedaten.");
    }));
    // 403 – User gesperrt (> 5 fehlgeschlagene Versuche)
    it("sollte 403 zurückgeben wenn der User gesperrt ist", () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, user_factory_1.createUser)({
            email: "gesperrt@firma.de",
            failed_login_attempts: 6, // ← über dem Limit
        });
        const res = yield (0, supertest_1.default)(app_1.default)
            .post("/api/v1/public/login")
            .send({ email: "gesperrt@firma.de", password: "Test1234!" });
        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Nutzer ist gesperrt.");
    }));
    // 400 – Validierungsfehler
    it("sollte 400 zurückgeben bei ungültigem Body", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app_1.default)
            .post("/api/v1/public/login")
            .send({ email: "keine-email", password: "" });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Validation Error");
        expect(res.body.errors).toBeDefined();
    }));
    // failed_login_attempts wird inkrementiert
    it("sollte failed_login_attempts nach falschem Passwort erhöhen", () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, user_factory_1.createUser)({ email: "max@firma.de" });
        yield (0, supertest_1.default)(app_1.default)
            .post("/api/v1/public/login")
            .send({ email: "max@firma.de", password: "Falsch!" });
        const user = yield testDataSource_1.testDataSource
            .getRepository("User")
            .findOneBy({ email: "max@firma.de" });
        expect(user === null || user === void 0 ? void 0 : user.failed_login_attempts).toBe(1);
    }));
});
//# sourceMappingURL=login.test.js.map