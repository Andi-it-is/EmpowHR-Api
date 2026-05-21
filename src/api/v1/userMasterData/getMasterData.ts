import { User } from "../../../entity/User";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";
import { UserMasterData } from "../../../entity/UserMasterData";
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope";


/**
 * @swagger
 * /userMasterData:
 *   get:
 *     summary: Stammdaten abrufen
 *     description: Gibt die Stammdaten des eingeloggten Benutzers zurück.
 *     tags:
 *       - Master Data
 *     responses:
 *       200:
 *         description: Stammdaten erfolgreich abgerufen
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
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     company_alias:
 *                       type: string
 *                       example: "m.mustermann"
 *                     street:
 *                       type: string
 *                       example: "Musterstraße 1"
 *                     zipcode:
 *                       type: string
 *                       example: "40213"
 *                     city:
 *                       type: string
 *                       example: "Düsseldorf"
 *                     country:
 *                       type: string
 *                       example: "Deutschland"
 *                     date_of_birth:
 *                       type: string
 *                       example: "1990-01-15"
 *                     telephone_business:
 *                       type: string
 *                       example: "+49 211 1234567"
 *                     telephone_private:
 *                       type: string
 *                       nullable: true
 *                       example: "+49 172 1234567"
 *                     banking_detail:
 *                       type: string
 *                       example: "DE89 3704 0044 0532 0130 00"
 *                     job_title:
 *                       type: string
 *                       nullable: true
 *                       example: "Software Entwickler"
 *                     started_working_date:
 *                       type: string
 *                       example: "2022-03-01"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-04-11T10:30:00.000Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-04-11T10:30:00.000Z"
 *                     user:
 *                       type: object
 *                       description: Zugehöriger Benutzer
 *       500:
 *         description: Serverfehler
 */
export const getMasterData: UserRequestHandler = async (req, res, next) => {
  try {

    const id = req.user.id

    const masterData = await AppDataSource.getRepository(UserMasterData)
      .findOne({
        where: {
          user: { id },
        },
        relations: ["user"]
      })

    //* < Block to determine allowed Scope per route >
    const isScopeAllowed = await checkPermissionScope({
      requestingUserId: req.user.id,
      allowedScope: req.maxTargetPermissionScope,
      resolveTargetUserId: () => req.user?.id,
      resolveTargetDepartmentId: () => req.user?.department?.id,
    })

    if (!isScopeAllowed) {
      return res.status(403).json({ success: false, message: "Keine Berechtigung für diese Aktion." })
    }
    //* < /Block to determine allowed Scope per route >

    return res.status(200).json({
      success: true,
      data: masterData
    })

  } catch (error) {
    next(error)
  }
}