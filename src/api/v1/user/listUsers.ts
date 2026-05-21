import { User } from "../../../entity/User";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope";

/**
 * @swagger
 * /user/all:
 *   get:
 *     summary: Alle Benutzer auflisten
 *     description: Gibt eine Liste aller Benutzer zurück.
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: Benutzerliste erfolgreich abgerufen
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
 *                         type: number
 *                         example: 1
 *                       firstname:
 *                         type: string
 *                         example: "Max"
 *                       lastname:
 *                         type: string
 *                         example: "Mustermann"
 *                       email:
 *                         type: string
 *                         format: email
 *                         example: "max.mustermann@example.com"
 *       500:
 *         description: Serverfehler
 */
export const listAllUsers: UserRequestHandler = async (req, res, next) => {
  try {

    const users = await AppDataSource.getRepository(User)
      .find({
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          disabled: true
        },
        relations: {
          department: true,
          roles: true
        },
        order: {
          firstname: "ASC",
          lastname: "ASC",
        }
      })

    //* < Block to determine allowed Scope per route >
    const isScopeAllowed = await checkPermissionScope({
      requestingUserId: req.user.id,
      allowedScope: req.maxTargetPermissionScope,
      resolveTargetUserId: () => req.user.id,
      resolveTargetDepartmentId: () => req.user?.department?.id,
    })

    if (!isScopeAllowed) {
      return res.status(403).json({ success: false, message: "Keine Berechtigung für diese Aktion." })
    }
    //* < /Block to determine allowed Scope per route >

    return res.status(200).json({
      success: true,
      data: users
    })

  } catch (error) {
    next(error)
  }
}