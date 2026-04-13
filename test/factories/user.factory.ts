// test/factories/user.factory.ts
import { testDataSource } from "../helpers/testDataSource"
import { User } from "../../src/entity/User"
import bcrypt from "bcryptjs"

type UserOverrides = Partial<Pick<User,
  | "firstname"
  | "lastname"
  | "email"
  | "disabled"
  | "failed_login_attempts"
  | "supervisor"
  | "department"
  | "roles"
>>

export async function createUser(overrides: UserOverrides = {}): Promise<User> {
  const repo = testDataSource.getRepository(User)

  const user = repo.create({
    firstname: "Max",
    lastname: "Mustermann",
    email: `user-${Date.now()}@example.com`,
    password_hash: await bcrypt.hash("Test1234!", 10),
    disabled: false,
    failed_login_attempts: 0,
    ...overrides,
  })

  return repo.save(user)
}

// Convenience Factories für häufige Fälle
export async function createDisabledUser(overrides: UserOverrides = {}): Promise<User> {
  return createUser({ disabled: true, ...overrides })
}

export async function createUserWithFailedLogins(count: number, overrides: UserOverrides = {}): Promise<User> {
  return createUser({ failed_login_attempts: count, ...overrides })
}