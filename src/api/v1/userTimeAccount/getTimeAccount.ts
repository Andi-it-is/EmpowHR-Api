import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { UserTimeAccount } from "../../../entity/UserTimeAccount"
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope"


/**
 * @swagger
 * /user/my-time-account:
 *   get:
 *     summary: Eigenes Zeitkonto abrufen
 *     description: >
 *       Liefert das Zeitkonto (UserTimeAccount) des aktuell authentifizierten Benutzers
 *       sowie die berechneten täglichen Sollarbeitsstunden. Der Zugriff wird über das
 *       Permission-Scope-System validiert.
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: Zeitkonto erfolgreich geladen.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: Die UserTimeAccount Entität
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "7a2bef5e-4b8e-5cae-bcde-3b1e8c4ecb7f"
 *                     contract_hours_per_week:
 *                       type: number
 *                       example: 40
 *                     working_days_per_week:
 *                       type: number
 *                       example: 5
 *                     vacation_days_per_year:
 *                       type: number
 *                       example: 30
 *                     delta_hours:
 *                       type: number
 *                       example: 2.5
 *                     valid_from:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-06-01T00:00:00.000Z"
 *                 shouldWorkHoursPerWeek:
 *                   type: number
 *                   description: Berechnete Sollarbeitsstunden pro Arbeitstag (contract_hours_per_week / working_days_per_week)
 *                   example: 8
 *       403:
 *         description: Fehlende Berechtigung (Permission Scope nicht ausreichend).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Keine Berechtigung für diese Aktion."
 *       404:
 *         description: Kein Zeitkonto für den Benutzer gefunden.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Kein Zeitkonto für diesen Benutzer gefunden."
 *       500:
 *         description: Interner Serverfehler.
 */
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