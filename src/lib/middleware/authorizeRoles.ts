// middleware/authorize.ts
import { Response, NextFunction } from "express";
import { UserRequest } from "../classes/UserRequestHandler";
import { UserRoleEnum } from "../enums/UserRoleEnum";

export const authorizeRoles = (allowedRoles: UserRoleEnum[]) => {
    return (req: UserRequest, res: Response, next: NextFunction) => {
        if (!req.role || !allowedRoles.includes(req.role)) {
            return res.status(403).json({ 
                success: false, 
                message: "Forbidden: You do not have the required permissions." 
            });
        }
        next();
    };
};