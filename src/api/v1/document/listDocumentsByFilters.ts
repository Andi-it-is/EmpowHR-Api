import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { Document } from "../../../entity/Document"
import { DocumentSecurityLevel, DocumentType } from "../../../lib/enums/acessControl.enum"
import { Between, In, MoreThanOrEqual, LessThanOrEqual, FindOptionsWhere } from "typeorm"
import Joi from 'joi'
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope"

const bodySchema = Joi.object({
  type: Joi.array().items(Joi.string().valid(...Object.values(DocumentType))).optional(),
  security_level: Joi.array().items(Joi.string().valid(...Object.values(DocumentSecurityLevel))).optional(),
  date_from: Joi.string().isoDate().optional(),
  date_to: Joi.string().isoDate().optional(),
})

/**
 * @swagger
 * /document/my/filter:
 *   post:
 *     summary: Dokumente gefiltert abrufen
 *     description: Gibt Dokumente des eingeloggten Benutzers gefiltert nach Typ, Sicherheitsstufe und Zeitraum zurück.
 *     tags:
 *       - Documents
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [CONTRACT, FINANCE, ABSENCE, QUALIFICATION, COMPLIANCE]
 *                 example: ["CONTRACT", "FINANCE"]
 *               security_level:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   enum: [1, 2, 3, 4]
 *                 description: "1 = RESTRICTED, 2 = CONFIDENTIAL, 3 = SECRET, 4 = TOP_SECRET"
 *                 example: [1, 2]
 *               date_from:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               date_to:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-31"
 *     responses:
 *       200:
 *         description: Dokumente erfolgreich abgerufen
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
 *                         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                       title:
 *                         type: string
 *                         example: "Arbeitsvertrag 2024"
 *                       type:
 *                         type: string
 *                         enum: [CONTRACT, FINANCE, ABSENCE, QUALIFICATION, COMPLIANCE]
 *                         example: "CONTRACT"
 *                       security_level:
 *                         type: integer
 *                         enum: [1, 2, 3, 4]
 *                         description: "1 = RESTRICTED, 2 = CONFIDENTIAL, 3 = SECRET, 4 = TOP_SECRET"
 *                         example: 1
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-04-11T10:30:00.000Z"
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-04-11T10:30:00.000Z"
 *       400:
 *         description: Validierungsfehler – ungültige Filterwerte
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
 *                   example: '"type[0]" must be one of [CONTRACT, FINANCE, ABSENCE, QUALIFICATION, COMPLIANCE]'
 *       500:
 *         description: Serverfehler
 */
export const listDocumentsByFilters: UserRequestHandler = async (req, res, next) => {
  try {
    const { type, security_level, date_from, date_to } = await bodySchema.validateAsync(req.body)

    const documents = await AppDataSource.getRepository(Document).find({
      where: {
        user: { id: req.user.id },
        ...(type?.length && { type: In(type) }),
        ...(security_level?.length && { security_level: In(security_level) }),
        ...(date_from && date_to && {
          created_at: Between(
            new Date(date_from),
            new Date(new Date(date_to).setDate(new Date(date_to).getDate() + 1))
          )
        }),
        ...(date_from && !date_to && { created_at: MoreThanOrEqual(new Date(date_from)) }),
        ...(!date_from && date_to && { created_at: LessThanOrEqual(new Date(date_to)) }),
      } satisfies FindOptionsWhere<Document>,
      select: {
        id: true,
        title: true,
        type: true,
        security_level: true,
        created_at: true,
        updated_at: true,
      },
      order: { created_at: 'DESC' }
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
      data: documents
    })

  } catch (error) {
    next(error)
  }
}