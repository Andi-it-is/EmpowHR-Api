import { Department } from "../../../entity/Department";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope";

export const listAllDepartments: UserRequestHandler = async (req, res, next) => {
  try {

    const departments = await AppDataSource.getRepository(Department)
      .find({
        relations: {
          head: true,
          users: true,
          parent: true,
        },
        order: {
          name: "ASC",
        }
      })

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
      data: departments
    })

  } catch (error) {
    next(error)
  }
}

