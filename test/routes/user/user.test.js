"use strict";
// test/routes/user/user.test.ts
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
        AppDataSource: testDataSource,
    };
});
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const testDataSource_1 = require("../../helpers/testDataSource");
const user_factory_1 = require("../../factories/user.factory");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// ─── Hilfsfunktion: gültiges JWT erzeugen ────────────────────────────────────
// Muss zu userTokenChecker passen: Payload-Feld ist "userId" (string)
function generateAccessToken(userId) {
    return jsonwebtoken_1.default.sign({
        userId: String(userId),
        firstname: "Test",
        lastname: "User",
        email: "test@example.com",
        roles: [],
        department: null,
    }, process.env.JWT_ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
}
// ─── DB Setup ────────────────────────────────────────────────────────────────
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield testDataSource_1.testDataSource.initialize();
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield testDataSource_1.testDataSource.destroy();
}));
afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
    yield testDataSource_1.testDataSource.query(`TRUNCATE TABLE "user" CASCADE`);
}));
// ─── Tests: GET /api/v1/user/simple ──────────────────────────────────────────
describe("GET /api/v1/user/simple", () => {
    // ── Happy Path ──────────────────────────────────────────────────────────────
    it("sollte 200 und firstname, lastname, email zurückgeben bei gültigem Token", () => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, user_factory_1.createUser)({
            firstname: "Anna",
            lastname: "Beispiel",
            email: "anna@firma.de",
        });
        const token = generateAccessToken(user.id);
        const res = yield (0, supertest_1.default)(app_1.default)
            .get("/api/v1/user/simple")
            .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({
            firstname: "Anna",
            lastname: "Beispiel",
            email: "anna@firma.de",
        });
    }));
    it("sollte kein password_hash oder andere sensible Felder zurückgeben", () => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, user_factory_1.createUser)({ email: "secure@firma.de" });
        const token = generateAccessToken(user.id);
        const res = yield (0, supertest_1.default)(app_1.default)
            .get("/api/v1/user/simple")
            .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.data.password_hash).toBeUndefined();
        expect(res.body.data.failed_login_attempts).toBeUndefined();
        expect(res.body.data.disabled).toBeUndefined();
    }));
    // ── 401 – User im Token existiert nicht in DB ───────────────────────────────
    it("sollte 401 zurückgeben wenn userId im Token nicht in der DB existiert", () => __awaiter(void 0, void 0, void 0, function* () {
        const ghostToken = generateAccessToken(999999999);
        const res = yield (0, supertest_1.default)(app_1.default)
            .get("/api/v1/user/simple")
            .set("Authorization", `Bearer ${ghostToken}`);
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Provided Token could not be authorized");
    }));
    // ── 401 – Auth Fehler ───────────────────────────────────────────────────────
    it("sollte 401 zurückgeben wenn kein Authorization-Header mitgeschickt wird", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app_1.default).get("/api/v1/user/simple");
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("No token provided");
    }));
    it("sollte 401 zurückgeben wenn der Token ungültig ist", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app_1.default)
            .get("/api/v1/user/simple")
            .set("Authorization", "Bearer dieser.token.istungueltig");
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Provided Token could not be authorized");
    }));
    it("sollte 401 zurückgeben wenn der Token abgelaufen ist", () => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, user_factory_1.createUser)({ email: "expired@firma.de" });
        const expiredToken = jsonwebtoken_1.default.sign({ userId: String(user.id), roles: [], department: null }, process.env.JWT_ACCESS_TOKEN_SECRET, { expiresIn: "0s" });
        const res = yield (0, supertest_1.default)(app_1.default)
            .get("/api/v1/user/simple")
            .set("Authorization", `Bearer ${expiredToken}`);
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    }));
    it("sollte 401 zurückgeben wenn Bearer fehlt (nur Token ohne Prefix)", () => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, user_factory_1.createUser)({ email: "nobearer@firma.de" });
        const token = generateAccessToken(user.id);
        const res = yield (0, supertest_1.default)(app_1.default)
            .get("/api/v1/user/simple")
            .set("Authorization", token); // kein "Bearer " davor
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("No token provided");
    }));
});
//# sourceMappingURL=user.test.js.map