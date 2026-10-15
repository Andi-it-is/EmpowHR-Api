import * as jwt from "jsonwebtoken";
import { AppDataSource } from "../../AppDataSource";
import { User } from "../../entity/User";
import { RoleName } from "../enums/acessControl.enum";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Prüft einen Access-Token und lädt den zugehörigen User inkl. Rollen und Department.
 * Wird von der userTokenChecker-Middleware und vom WebSocket-Handshake genutzt.
 *
 * Fehlerarten bewusst getrennt, damit Aufrufer reagieren können:
 * - jwt.JsonWebTokenError (inkl. TokenExpiredError): Problem mit dem Token -> 401
 * - jeder andere Fehler (z. B. DB nicht erreichbar): Problem beim Server -> 500
 *
 * @throws jwt.JsonWebTokenError wenn der Token ungültig, abgelaufen oder die userId kein UUID ist
 * @throws andere Fehler bei Problemen mit der Datenbank
 * @returns den User oder null, wenn der User aus dem Token nicht (mehr) existiert
 */
export const verifyAccessToken = async (token: string): Promise<User | null> => {
  // 1. Verify Token
  const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET!) as {
    userId: string
    firstname: string
    lastname: string
    email: string
    roles: RoleName[]
    department: string | null
  }

  // Kein UUID: Postgres würde mit einem Query-Fehler abbrechen, der dann wie ein DB-Ausfall
  // aussähe. Ein solcher Token ist schlicht ungültig.
  if (typeof decoded.userId !== "string" || !UUID_PATTERN.test(decoded.userId)) {
    throw new jwt.JsonWebTokenError("invalid userId")
  }

  // 2. User + Rollen + Department aus DB holen
  return AppDataSource.getRepository(User).findOne({
    where: { id: decoded.userId },
    relations: {
      roles: true,
      department: true
    }
  })
}
