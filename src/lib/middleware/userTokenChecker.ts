import { APIError } from "../classes/APIError";
import * as jwt from "jsonwebtoken";
import { AppDataSource } from "../../AppDataSource";
import { UserRequest, UserRequestHandler } from "../classes/UserRequestHandler";
import { User } from "../../entity/User";
import { RoleName } from "../enums/acessControl.enum";
import { RequestHandler } from "express";


export const userTokenChecker: UserRequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // 1. Verify Token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET!) as {
      userId: string
      firstname: string
      lastname: string
      email: string
      roles: RoleName[]
      department: string | null
    }

    // 2. User + Rollen + Department aus DB holen
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: decoded.userId },
      relations: {
        roles: true,
        department: true
      }
    })

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

    return res.status(401).json({
      success: false,
      message: 'Provided Token could not be authorized',
      error: error
    });
  }
};