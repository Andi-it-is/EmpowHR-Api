import { APIError } from "../classes/APIError";
import { UserRequest, UserRequestHandler } from "../classes/UserRequestHandler";
import { NextFunction } from "express";
import { resolvePermissionsAsUniqueArray, resolveRoles } from "./resolveRolesPermissions";

export const permissionChecker = (input: any) => {

  return async (req: UserRequest, res: any, next: NextFunction): Promise<any> => {

    const rolesWithPermissions = await resolveRoles(req.user.id)
    console.log(JSON.stringify(rolesWithPermissions, null, 2))
    console.log("&& \n \n")

    const uniquePermissions = await resolvePermissionsAsUniqueArray(req.user.id)
    // console.log("&&&\n \n ", uniquePermissions, " \n \n %%%")
    console.log(JSON.stringify(uniquePermissions, null, 2))
    return rolesWithPermissions

    // const hasPermission = _checkPermission(input, rolesWithPermissions);

    // if (!hasPermission) {
    //   next(APIError.errorForbidden());
    // }

    next();

  };
};


// // check if any of the roles includes input
// export function _checkPermission(input: string | string[] | string[][], permissions: string[]): boolean {

//   let required: string[][];

//   // convert every input to string[][];
//   if (typeof input == "string") {
//     // if input is string
//     required = [[input]];
//   } else if (_isArray(input) && (input as Array<string>).every(_isString)) {
//     // if input is string[]
//     required = [input as string[]];
//   } else {
//     // input is string[][]
//     required = input as string[][];
//   }

//   // at least one element is true
//   const isSufficient = required.some((r) => {
//     // every r element is owned by user
//     return r.every((permission) => {
//       return permissions.indexOf(permission) !== -1;
//     });
//   });

//   if (!isSufficient) {
//     return false;
//   }

//   return true;
// }
