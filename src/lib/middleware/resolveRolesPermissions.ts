import { Response, NextFunction } from "express"
import { UserRequest } from "../classes/UserRequestHandler"
import { RoleName } from "../enums/acessControl.enum"
import { AppDataSource } from "../../AppDataSource"
import { Role } from "../../entity/Role"
import { In } from "typeorm"
import { Permission } from "../../entity/Permission"

/**
 * @returns all the roles with their respective permissions
 */
export const resolveRoles = async (userId: string): Promise<Role[]> => {
    const rolesAndPemissions = await AppDataSource
        .getRepository(Role)
        .createQueryBuilder("role")
        .leftJoinAndSelect("role.permissions", "permission")
        .leftJoin("role.users", "user")
        .where("user.id = :userId", { userId })
        .distinct(true)
        .getMany()
    return rolesAndPemissions
}

/**
 * 
 * @returns one array with the uninon of all the permissions from every role the user has. 
 */
export const resolvePermissionsAsUniqueArray = async (userId: string): Promise<Permission[]> => {

    const permissions = await AppDataSource
        .getRepository(Permission)
        .createQueryBuilder("permission")
        .leftJoin("permission.roles", "role")
        .leftJoin("role.users", "user")
        .where("user.id = :userId", { userId })
        .distinct(true)
        .getMany()

    return permissions
} 