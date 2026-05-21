import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { Permission } from "../../../entity/Permission"
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope"

/**
 * @swagger
 * /permission:
 *   get:
 *     summary: Alle Berechtigungen abrufen
 *     description: Gibt eine Liste aller verfügbaren Berechtigungen im System zurück.
 *     tags:
 *       - Permission
 *     responses:
 *       200:
 *         description: Berechtigungen erfolgreich abgerufen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       entity:
 *                         type: string
 *                         enum: [USER, DEPARTMENT, TIME_ENTRY, ABSENCE, ROLE, PERMISSION]
 *                         description: "Betroffene Entität"
 *                       action:
 *                         type: string
 *                         enum: [CREATE, READ, UPDATE, DELETE]
 *                         description: "Erlaubte Aktion"
 *                       scope:
 *                         type: string
 *                         enum: [OWN, DEPARTMENT, GLOBAL]
 *                         description: "Geltungsbereich der Berechtigung"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *       403:
 *         description: Keine Berechtigung
 *       500:
 *         description: Serverfehler
 */
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