import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";
import { UserMasterData } from "../../../entity/UserMasterData";
import Joi from "joi"
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope";

const paramsSchema = Joi.object({
  id: Joi.string().uuid().required(),
})

const bodySchema = Joi.object({
  // name
  firstname: Joi.string().min(1).max(100).optional(),
  lastname: Joi.string().min(1).max(100).optional(),
  date_of_birth: Joi.string().isoDate().optional(),

  // address
  street: Joi.string().min(2).max(90).optional(),
  zipcode: Joi.string().min(4).max(6).optional(),
  city: Joi.string().min(2).max(100).optional(),
  country: Joi.string().min(2).max(100).optional(),

  // contact
  telephone_business: Joi.string().min(6).max(20).optional(),
  telephone_private: Joi.string().min(6).max(20).allow('').optional(),
  company_alias: Joi.string().min(1).max(50).optional(),

  // other
  job_title: Joi.string().min(1).max(100).optional(),
  started_working_date: Joi.string().isoDate().optional(),
  banking_detail: Joi.string().min(24).max(30).optional(),
})

/**
 * @swagger
 * /user/{id}/master-data:
 *   put:
 *     summary: Stammdaten eines Benutzers aktualisieren
 *     description: >
 *       Aktualisiert die Stammdaten (UserMasterData) sowie optionale Basisdaten (firstname, lastname) 
 *       eines spezifischen Benutzers anhand dessen ID. Der Zugriff wird über das Permission-Scope-System validiert.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstname:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: "Max"
 *               lastname:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: "Mustermann"
 *               date_of_birth:
 *                 type: string
 *                 format: date-time
 *                 example: "1990-01-15T00:00:00.000Z"
 *               street:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 90
 *                 example: "Musterstraße 1"
 *               zipcode:
 *                 type: string
 *                 minLength: 4
 *                 maxLength: 6
 *                 example: "40210"
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
 *               telephone_business:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 20
 *                 example: "+49 211 1000-100"
 *               telephone_private:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 20
 *                 nullable: true
 *                 example: "+49 172 1234567"
 *               company_alias:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 example: "MMU"
 *               job_title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: "Senior Fullstack Developer"
 *               started_working_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T00:00:00.000Z"
 *               banking_detail:
 *                 type: string
 *                 minLength: 24
 *                 maxLength: 30
 *                 example: "DE89 3704 0044 0532 0130 00"
 *     responses:
 *       200:
 *         description: Stammdaten erfolgreich aktualisiert.
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
 *                   description: Die aktualisierte UserMasterData Entität
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
 *       400:
 *         description: Validierungsfehler (z. B. fehlerhafte Felder oder ungültige UUID).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "\"zipcode\" length must be at least 4 characters long"
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
 *         description: Stammdaten des Benutzers nicht gefunden.
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
 *                   example: "Stammdaten nicht gefunden"
 *       500:
 *         description: Interner Serverfehler.
 */
export const updateMasterDataById: UserRequestHandler = async (req, res, next) => {
  try {
    const params = await paramsSchema.validateAsync(req.params)
    const body = await bodySchema.validateAsync(req.body)

    const masterDataRepo = AppDataSource.getRepository(UserMasterData)

    const masterData = await masterDataRepo.findOne({
      where: { user: { id: params.id } },
      relations: ['user'],
    })

    if (!masterData) {
      return res.status(404).json({ success: false, message: 'Stammdaten nicht gefunden' })
    }

    //* < Block to determine allowed Scope per route >
    const isScopeAllowed = await checkPermissionScope({
      requestingUserId: req.user.id,
      allowedScope: req.maxTargetPermissionScope,
      resolveTargetUserId: () => params.id,
      resolveTargetDepartmentId: () => masterData.user?.department?.id,
    })

    if (!isScopeAllowed) {
      return res.status(403).json({ success: false, message: "Keine Berechtigung für diese Aktion." })
    }
    //* < /Block to determine allowed Scope per route >

    // Felder die auf dem User liegen separat behandeln
    const { firstname, lastname, ...masterDataFields } = body

    if (firstname || lastname) {
      const user = masterData.user
      if (firstname) user.firstname = firstname
      if (lastname) user.lastname = lastname
      await AppDataSource.manager.save(user)
    }


    Object.assign(masterData, masterDataFields)
    const saved = await AppDataSource.manager.save(masterData)

    return res.status(200).json({
      success: true,
      message: 'Stammdaten erfolgreich aktualisiert',
      data: saved,
    })

  } catch (error) {
    next(error)
  }
}