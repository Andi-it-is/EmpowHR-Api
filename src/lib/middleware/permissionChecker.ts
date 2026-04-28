import { APIError } from "../classes/APIError";
import { UserRequest, UserRequestHandler } from "../classes/UserRequestHandler";
import { NextFunction } from "express";
import { resolvePermissionsAsUniqueArray, resolveRoles } from "./resolveRolesPermissions";
import { ExistingEntityNames, PermissionAction, PermissionScope } from "../enums/acessControl.enum";


/**
 * example call
 * userRouter.get(
 *  '/all',  
 *  permissionChecker(ExistingEntityNames.USER, PermissionAction.READ, PermissionScope.SELF), 
 *  listAllUsers
 * )
 *
 * @param entity The name of an entity found in "ExistingEntityNames" enum
 * @param action The name of an action found in "PermissionAction" enum
 * @param requiredScope The name of a scope found in "PermissionScope" enum
 * @returns 403 if the user is not allowed to request the ressource. passthrough if the user is allowed
 */
export const permissionChecker = (
  entity: ExistingEntityNames,
  action: PermissionAction,
  requiredScope: PermissionScope
) => {
  return async (req: UserRequest, res: any, next: NextFunction): Promise<any> => {

    const uniquePermissions = await resolvePermissionsAsUniqueArray(req.user.id)

    const scopeStrength: Record<PermissionScope, number> = {
      [PermissionScope.ALL]: 4,
      [PermissionScope.DEPARTMENT]: 3,
      [PermissionScope.SUBORDINATE]: 2,
      [PermissionScope.SELF]: 1,
    }

    const matching = uniquePermissions.filter(
      p => p.entity === entity && p.action === action
    )

    if (!matching.length) {
      return next(APIError.errorForbidden())
    }

    const bestScope = matching.sort(
      (a, b) => scopeStrength[b.scope] - scopeStrength[a.scope]
    )[0].scope

    // Prüfe ob bester Scope >= required Scope
    if (scopeStrength[bestScope] < scopeStrength[requiredScope]) {
      return next(APIError.errorForbidden())
    }

    next()
  }
}
