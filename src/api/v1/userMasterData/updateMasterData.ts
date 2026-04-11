import { User } from "../../../entity/User";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";
import { UserMasterData } from "../../../entity/UserMasterData";
import Joi from "joi"

export const bodySchema = Joi.object({
  street: Joi.string().min(2).max(90).optional(),
  zipcode: Joi.string().min(4).max(6).optional(),
  city: Joi.string().min(2).max(100).optional(),
  country: Joi.string().min(2).max(100).optional(),
  banking_detail: Joi.string().min(24).max(30).optional(),
})

/**
 * @swagger
 * /userMasterData:
 *   patch:
 *     summary: Stammdaten aktualisieren
 *     description: Aktualisiert die editierbaren Stammdaten des eingeloggten Benutzers.
 *     tags:
 *       - Master Data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               street:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 90
 *                 example: "Musterstraße 1"
 *               zipcode:
 *                 type: string
 *                 minLength: 4
 *                 maxLength: 6
 *                 example: "40213"
 *               city:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Düsseldorf"
 *               country:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Deutschland"
 *               banking_detail:
 *                 type: string
 *                 minLength: 24
 *                 maxLength: 30
 *                 example: "DE89 3704 0044 0532 0130 00"
 *     responses:
 *       200:
 *         description: Stammdaten erfolgreich aktualisiert
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Stammdaten erfolgreich aktualisiert"
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
 *       400:
 *         description: Validierungsfehler – ungültige Feldwerte
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
 *                   example: '"street" length must be at least 2 characters long'
 *       500:
 *         description: Serverfehler
 */
export const updateMasterData: UserRequestHandler = async (req, res, next) => {
  try {

    const id = req.user.id

    const body = await bodySchema.validateAsync(req.body)

    const masterData = await AppDataSource.getRepository(UserMasterData)
      .findOne({
        where: {
          user: { id },
        },
        relations: ["user"]
      })

    if (masterData) {
      Object.assign(masterData, body);
    }

    const savedMasterData = await AppDataSource.manager.save(masterData)

    return res.status(200).json({
      success: true,
      message: "Stammdaten erfolgreich aktualisiert",
      data: savedMasterData
    });

  } catch (error) {
    next(error)
  }
}