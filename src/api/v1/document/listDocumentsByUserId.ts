import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { Document } from "../../../entity/Document"
import Joi from 'joi'

const paramsSchema = Joi.object({
  id: Joi.string().uuid().required()
})

/**
 * @swagger
 * /document/user/{id}:
 *   get:
 *     summary: Dokumente eines Benutzers abrufen
 *     description: Gibt alle Dokumente eines bestimmten Benutzers zurück, sortiert nach Erstellungsdatum absteigend. Nur für HR-Manager zugänglich.
 *     tags:
 *       - Documents
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID des Benutzers
 *         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
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
 *         description: Validierungsfehler – ungültige User-ID
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
 *                   example: '"id" must be a valid GUID'
 *       500:
 *         description: Serverfehler
 */
export const listDocumentsByUserId: UserRequestHandler = async (req, res, next) => {
  try {
    const { id } = await paramsSchema.validateAsync(req.params)

    const documents = await AppDataSource.getRepository(Document).find({
      where: { user: { id } },
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

    return res.status(200).json({
      success: true,
      data: documents
    })

  } catch (error) {
    next(error)
  }
}