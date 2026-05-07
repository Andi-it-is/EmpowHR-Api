import { Department } from "../../../entity/Department";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope";

/**
 * @swagger
 * /department/all:
 *   get:
 *     summary: Alle Abteilungen auflisten
 *     description: Gibt eine Liste aller Abteilungen zurück.
 *     tags:
 *       - Department
 *     responses:
 *       200:
 *         description: Abteilungsliste erfolgreich abgerufen
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
 *                         example: "de8c5727-48da-47e4-bdb2-551aec55cb6f"
 *                       name:
 *                         type: string
 *                         example: "IT"
 *                       cost_center:
 *                         type: string
 *                         example: "CX_420420"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Serverfehler
 */
export const listAllDepartments: UserRequestHandler = async (req, res, next) => {
  try {

    const departments = await AppDataSource.getRepository(Department)
      .find({
        select: {
          id: true,
          name: true,
          cost_center: true,
          parent: true,
          children: true,
          created_at: true,
          updated_at: true,
        },
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