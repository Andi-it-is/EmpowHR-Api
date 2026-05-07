import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { Document } from "../../../entity/Document"
import { DocumentSecurityLevel, DocumentType } from "../../../lib/enums/acessControl.enum"
import Joi from 'joi'

const paramSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  documentId: Joi.string().uuid().required(),
})

const bodySchema = Joi.object({
  title: Joi.string().max(255).optional(),
  type: Joi.string().valid(...Object.values(DocumentType)).optional(),
  security_level: Joi.number()
    .valid(...Object.values(DocumentSecurityLevel).filter(v => typeof v === 'number'))
    .optional(),
})

/**
 * @swagger
 * /document/other/{userId}/{documentId}:
 *   patch:
 *     summary: Dokument eines Benutzers aktualisieren
 *     description: Aktualisiert die Metadaten eines Dokuments eines bestimmten Benutzers. Nur für HR-Manager zugänglich.
 *     tags:
 *       - Documents
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID des Benutzers
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID des Dokuments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               type:
 *                 type: string
 *                 enum: [CONTRACT, FINANCE, ABSENCE, QUALIFICATION, COMPLIANCE]
 *               security_level:
 *                 type: integer
 *                 enum: [1, 2, 3, 4]
 *     responses:
 *       200:
 *         description: Dokument erfolgreich aktualisiert
 *       404:
 *         description: Dokument nicht gefunden
 *       400:
 *         description: Validierungsfehler
 *       500:
 *         description: Serverfehler
 */
export const updateDocumentByUserId: UserRequestHandler = async (req, res, next) => {
  try {
    const { userId, documentId } = await paramSchema.validateAsync(req.params)
    const body = await bodySchema.validateAsync(req.body)

    const document = await AppDataSource.getRepository(Document).findOne({
      where: { id: documentId, user: { id: userId } },
    })

    if (!document) {
      return res.status(404).json({ success: false, message: 'Dokument nicht gefunden.' })
    }

    await AppDataSource.getRepository(Document).update({ id: documentId }, {
      ...(body.title && { title: body.title }),
      ...(body.type && { type: body.type }),
      ...(body.security_level !== undefined && { security_level: body.security_level }),
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    next(error)
  }
}