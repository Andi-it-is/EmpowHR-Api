import { User } from "../../../entity/User";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";
import { UserMasterData } from "../../../entity/UserMasterData";
import Joi from "joi";
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope";

const paramsSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

/**
 * @swagger
 * /user/{id}/master-data:
 *   get:
 *     summary: Stammdaten eines Benutzers anhand der ID abrufen
 *     description: >
 *       Liefert die vollständigen Stammdaten (UserMasterData) eines spezifischen Benutzers.
 *       Der Zugriff wird über das Permission-Scope-System validiert.
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Die UUID des Benutzers
 *         example: "42a1deb4-3b7d-4bad-9bdd-2b0d7b3dcb6d"
 *     responses:
 *       200:
 *         description: Stammdaten erfolgreich geladen.
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
 *                   description: Die UserMasterData Entität
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "8c2bef5e-4b8e-5cae-bcde-3b1e8c4ecb7e"
 *                     company_alias:
 *                       type: string
 *                       example: "MMU"
 *                     street:
 *                       type: string
 *                       example: "Musterstraße 1"
 *                     zipcode:
 *                       type: string
 *                       example: "40210"
 *                     city:
 *                       type: string
 *                       example: "Düsseldorf"
 *                     country:
 *                       type: string
 *                       example: "Deutschland"
 *                     date_of_birth:
 *                       type: string
 *                       format: date
 *                       example: "1990-01-15"
 *                     telephone_business:
 *                       type: string
 *                       example: "+49 211 1000-100"
 *                     telephone_private:
 *                       type: string
 *                       nullable: true
 *                       example: "+49 172 1234567"
 *                     banking_detail:
 *                       type: string
 *                       example: "DE89 3704 0044 0532 0130 00"
 *                     job_title:
 *                       type: string
 *                       example: "Senior Fullstack Developer"
 *                     started_working_date:
 *                       type: string
 *                       format: date
 *                       example: "2024-01-15"
 *                     user:
 *                       type: object
 *                       description: Die verknüpfte User-Entität
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           example: "42a1deb4-3b7d-4bad-9bdd-2b0d7b3dcb6d"
 *                         firstname:
 *                           type: string
 *                           example: "Max"
 *                         lastname:
 *                           type: string
 *                           example: "Mustermann"
 *                         email:
 *                           type: string
 *                           format: email
 *                           example: "max.mustermann@company.com"
 *       400:
 *         description: Validierungsfehler (z. B. ungültige UUID).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "\"id\" must be a valid GUID"
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
 *       500:
 *         description: Interner Serverfehler.
 */
export const getMasterDataById: UserRequestHandler = async (req, res, next) => {
  try {

    const params = await paramsSchema.validateAsync(req.params)
    const masterData = await AppDataSource.getRepository(UserMasterData)
      .findOne({
        where: {
          user: {
            id: params.id
          },
        },
        relations: ["user"]
      })

    //* < Block to determine allowed Scope per route >
    const isScopeAllowed = await checkPermissionScope({
      requestingUserId: req.user.id,
      allowedScope: req.maxTargetPermissionScope,
      resolveTargetUserId: () => params.id,
      resolveTargetDepartmentId: () => masterData?.user?.department?.id,
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