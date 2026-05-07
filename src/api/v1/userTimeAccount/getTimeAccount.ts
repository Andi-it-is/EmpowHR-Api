import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { UserTimeAccount } from "../../../entity/UserTimeAccount"
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope"

export const getMyTimeAccount: UserRequestHandler = async (req, res, next) => {
  try {
    const timeAccount = await AppDataSource.getRepository(UserTimeAccount).findOne({
      where: { user: { id: req.user.id } },
    })

    if (!timeAccount) {
      return res.status(404).json({
        success: false,
        message: 'Kein Zeitkonto für diesen Benutzer gefunden.',
      })
    }

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

    const shouldWorkHoursPerWeek = timeAccount.contract_hours_per_week / timeAccount.working_days_per_week

    return res.status(200).json({
      success: true,
      data: timeAccount,
      shouldWorkHoursPerWeek: shouldWorkHoursPerWeek
    })

  } catch (error) {
    next(error)
  }
}