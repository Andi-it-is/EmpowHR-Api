import { NextFunction, Request, Response } from "express";
import { User } from "../../entity/User";
import { Department } from "../../entity/Department";
import { Role } from "../../entity/Role";
import { PermissionScope, RoleName } from "../enums/acessControl.enum";

export interface UserRequest extends Request {
  user: User
  roles: RoleName[]
  department: String | null // name
  maxTargetPermissionScope: PermissionScope
}

export type UserRequestHandler = (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => unknown