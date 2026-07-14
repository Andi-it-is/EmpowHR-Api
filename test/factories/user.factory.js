"use strict";
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
exports.createUser = createUser;
exports.createDisabledUser = createDisabledUser;
exports.createUserWithFailedLogins = createUserWithFailedLogins;
// test/factories/user.factory.ts
const testDataSource_1 = require("../helpers/testDataSource");
const User_1 = require("../../src/entity/User");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
function createUser() {
    return __awaiter(this, arguments, void 0, function* (overrides = {}) {
        const repo = testDataSource_1.testDataSource.getRepository(User_1.User);
        const user = repo.create(Object.assign({ firstname: "Max", lastname: "Mustermann", email: `user-${Date.now()}@example.com`, password_hash: yield bcryptjs_1.default.hash("Test1234!", 10), disabled: false, failed_login_attempts: 0 }, overrides));
        return repo.save(user);
    });
}
// Convenience Factories für häufige Fälle
function createDisabledUser() {
    return __awaiter(this, arguments, void 0, function* (overrides = {}) {
        return createUser(Object.assign({ disabled: true }, overrides));
    });
}
function createUserWithFailedLogins(count_1) {
    return __awaiter(this, arguments, void 0, function* (count, overrides = {}) {
        return createUser(Object.assign({ failed_login_attempts: count }, overrides));
    });
}
//# sourceMappingURL=user.factory.js.map