import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { Certificate } from "../../../entity/Certificate"
import Joi from 'joi'
import fs from 'fs'
import path from 'path'

const paramSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  certId: Joi.string().uuid().required(),
})

/**
 * @swagger
 * /certificate/other/{userId}/{certId}:
 *   delete:
 *     summary: Zertifikat eines anderen Benutzers löschen
 *     description: Löscht ein Zertifikat eines bestimmten Benutzers inkl. der Datei. Nur für HR-Berechtigte.
 *     tags:
 *       - Certificates
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID des Benutzers
 *       - in: path
 *         name: certId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID des Zertifikats
 *     responses:
 *       200:
 *         description: Zertifikat erfolgreich gelöscht
 *       404:
 *         description: Zertifikat nicht gefunden
 *       500:
 *         description: Serverfehler
 */
export const deleteCertificateForUser: UserRequestHandler = async (req, res, next) => {
  try {
    const { userId, certId } = await paramSchema.validateAsync(req.params)

    const certificate = await AppDataSource.getRepository(Certificate).findOne({
      where: { id: certId, user: { id: userId } },
    })

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Zertifikat nicht gefunden.' })
    }

    // Datei vom Dateisystem löschen
    const filePath = path.join(process.cwd(), certificate.file_path)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    await AppDataSource.getRepository(Certificate).delete({ id: certId })

    return res.status(200).json({ success: true, message: 'Zertifikat erfolgreich gelöscht.' })
  } catch (error) {
    next(error)
  }
}