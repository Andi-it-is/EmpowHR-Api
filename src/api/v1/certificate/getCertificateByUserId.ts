import path from 'path'
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import Joi from 'joi'
import { Certificate } from '../../../entity/Certificate'

const paramSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  certId: Joi.string().uuid().required(),
})

/**
 * @swagger
 * /certificate/other/{userId}/{certId}/file:
 *   get:
 *     summary: Zertifikat eines anderen Benutzers als PDF abrufen
 *     description: Gibt das PDF eines bestimmten Zertifikats eines Benutzers zurück. Nur für HR-Berechtigte.
 *     tags:
 *       - Certificates
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: certId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: PDF erfolgreich zurückgegeben
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Zertifikat nicht gefunden
 *       500:
 *         description: Serverfehler
 */
export const getCertificateByUserId: UserRequestHandler = async (req, res, next) => {
  try {
    const { userId, certId } = await paramSchema.validateAsync(req.params)

    const certificate = await AppDataSource.getRepository(Certificate).findOne({
      where: { id: certId, user: { id: userId } },
    })

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Nicht gefunden' })
    }

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${certificate.title}.pdf"`)
    res.sendFile(path.join(process.cwd(), certificate.file_path))
  } catch (error) {
    next(error)
  }
}