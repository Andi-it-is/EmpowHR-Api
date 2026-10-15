import { APIError } from "../classes/APIError";
import { UserRequest, UserRequestHandler } from "../classes/UserRequestHandler";
import { RoleName } from "../enums/acessControl.enum";
import { verifyAccessToken } from "../helpers/verifyAccessToken";
import * as jwt from "jsonwebtoken";
import { RequestHandler } from "express";

// uses req.cookies.accessToken.  Alternatively but not implemented, one can use req.headers.authorization
export const userTokenChecker: UserRequestHandler = async (req, res, next) => {
  try {
    // console.log('cookies:', req.cookies)
    // console.log('token:', req.cookies?.accessToken)
    // Cookie statt Authorization Header
    // const token = req.cookies?.accessToken
    // if (!token) {
    //   return res.status(401).json({ success: false, message: "No token provided" });
    // }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];

    // 1. + 2. Token prüfen, User + Rollen + Department aus DB holen
    const user = await verifyAccessToken(token)

    if (!user) {
      return res.status(401).json({ success: false, message: "User nicht gefunden." })
    }

    // 3. An Request anhängen
    const authReq = req as UserRequest
    authReq.user = user
    authReq.roles = user.roles.map(r => r.name) as RoleName[]
    authReq.department = user.department?.name ?? ''

    next(); // Proceed to the route handler

  } catch (error) {

    // Ungültiger oder abgelaufener Token -> 401 (Frontend meldet den User ab)
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Provided Token could not be authorized',
        error: error
      });
    }

    // Alles andere liegt am Server (z. B. DB kurz nicht erreichbar). Kein 401, sonst würde
    // der axios-Interceptor im Frontend das Cookie löschen und alle User abmelden.
    console.error("userTokenChecker: Token konnte wegen eines Serverfehlers nicht geprüft werden:", error);
    return res.status(500).json({
      success: false,
      message: 'Anmeldung konnte gerade nicht geprüft werden. Bitte später erneut versuchen.'
    });
  }
};