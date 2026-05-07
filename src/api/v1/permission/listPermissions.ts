import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { Permission } from "../../../entity/Permission"
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope"

export const listPermissions: UserRequestHandler = async (req, res, next) => {
  try {
    const permissions = await AppDataSource.getRepository(Permission).find()

    //* < Block to determine allowed Scope per route >
    const isScopeAllowed = await checkPermissionScope({
      requestingUserId: req.user.id,
      allowedScope: req.maxTargetPermissionScope,
      resolveTargetUserId: () => req.user.id,
      resolveTargetDepartmentId: () => req.user.department.id,
    })

    if (!isScopeAllowed) {
      return res.status(403).json({ success: false, message: "Keine Berechtigung für diese Aktion." })
    }
    //* < /Block to determine allowed Scope per route >

    return res.status(200).json({
      success: true,
      data: permissions,
    })

  } catch (error) {
    next(error)
  }
}