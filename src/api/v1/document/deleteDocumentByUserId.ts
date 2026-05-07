import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { Document } from "../../../entity/Document"
import Joi from 'joi'
import path from 'path'
import fs from 'fs'

const paramSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  documentId: Joi.string().uuid().required(),
})

/**
 * @swagger
 * /document/other/{userId}/{documentId}:
 *   delete:
 *     summary: Dokument eines Benutzers löschen
 *     description: Löscht ein Dokument eines bestimmten Benutzers samt Datei. Nur für HR-Manager zugänglich.
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
 *     responses:
 *       200:
 *         description: Dokument erfolgreich gelöscht
 *       404:
 *         description: Dokument nicht gefunden
 *       500:
 *         description: Serverfehler
 */
export const deleteDocumentByUserId: UserRequestHandler = async (req, res, next) => {
  try {
    const { userId, documentId } = await paramSchema.validateAsync(req.params)

    const document = await AppDataSource.getRepository(Document).findOne({
      where: { id: documentId, user: { id: userId } },
    })

    if (!document) {
      return res.status(404).json({ success: false, message: 'Dokument nicht gefunden.' })
    }

    // Datei vom Dateisystem löschen
    const absolutePath = path.join(process.cwd(), document.file_path)
    fs.unlink(absolutePath, (err) => {
      if (err) console.warn(`Datei konnte nicht gelöscht werden: ${absolutePath}`, err)
    })

    await AppDataSource.getRepository(Document).delete({ id: documentId })

    return res.status(200).json({ success: true })
  } catch (error) {
    next(error)
  }
}