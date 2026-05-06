import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { Certificate } from "../../../entity/Certificate"
import Joi from 'joi'

const paramSchema = Joi.object({
  id: Joi.string().uuid().required(),
})

/**
 * @swagger
 * /certificate/other/{id}:
 *   get:
 *     summary: Zertifikate eines anderen Benutzers abrufen
 *     description: Gibt alle Zertifikate eines bestimmten Benutzers zurück. Nur für HR-Berechtigte.
 *     tags:
 *       - Certificates
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID des Benutzers
 *     responses:
 *       200:
 *         description: Zertifikate erfolgreich abgerufen
 *       400:
 *         description: Validierungsfehler
 *       500:
 *         description: Serverfehler
 */
export const listCertificatesByUserId: UserRequestHandler = async (req, res, next) => {
  try {
    const { id } = await paramSchema.validateAsync(req.params)

    const certificates = await AppDataSource.getRepository(Certificate).find({
      where: { user: { id } },
      select: {
        id: true,
        title: true,
        description: true,
        issued_at: true,
        expires_at: true,
        created_at: true,
        updated_at: true,
      },
      order: { created_at: 'DESC' }
    })

    return res.status(200).json({
      success: true,
      data: certificates
    })
  } catch (error) {
    next(error)
  }
}