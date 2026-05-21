import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { Role } from "../../../entity/Role"
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope"

/**
 * @swagger
 * /role:
 *   get:
 *     summary: Alle Rollen abrufen
 *     description: Gibt eine Liste aller Rollen im System zurück, inklusive der zugehörigen Berechtigungen.
 *     tags:
 *       - Role
 *     responses:
 *       200:
 *         description: Rollen erfolgreich abgerufen
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
 *                       name:
 *                         type: string
 *                         enum: [ADMIN, HR_MANAGER, MANAGER, EMPLOYEE]
 *                         description: "Rollenname"
 *                       max_security_level:
 *                         type: integer
 *                         description: "Maximales Dokumenten-Sicherheitslevel der Rolle"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                       permissions:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             entity:
 *                               type: string
 *                               enum: [USER, DEPARTMENT, TIME_ENTRY, ABSENCE, ROLE, PERMISSION]
 *                             action:
 *                               type: string
 *                               enum: [CREATE, READ, UPDATE, DELETE]
 *                             scope:
 *                               type: string
 *                               enum: [OWN, DEPARTMENT, GLOBAL]
 *                             created_at:
 *                               type: string
 *                               format: date-time
 *                             updated_at:
 *                               type: string
 *                               format: date-time
 *       403:
 *         description: Keine Berechtigung
 *       500:
 *         description: Serverfehler
 */
export const listRoles: UserRequestHandler = async (req, res, next) => {
  try {
    const roles = await AppDataSource.getRepository(Role).find({
      relations: {
        permissions: true
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
      data: roles
    })

  } catch (error) {
    next(error)
  }
}