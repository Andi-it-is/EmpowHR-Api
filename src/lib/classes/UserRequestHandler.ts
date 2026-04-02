import { NextFunction, Request, Response } from "express";
import { User } from "../../entity/User";
import { UserRoleEnum } from "../enums/UserRoleEnum";

export interface UserRequest extends Request {
  user: User,
  role: UserRoleEnum
}

export type UserRequestHandler = (req: UserRequest, res: Response, next: NextFunction) => unknown;