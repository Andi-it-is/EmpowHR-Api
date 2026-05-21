import path from 'path'
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { Certificate } from "../../../entity/Certificate"
import Joi from 'joi'
import { User } from '../../../entity/User'
import { checkPermissionScope } from '../../../lib/helpers/checkPermissionScope'

const paramSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  certId: Joi.string().uuid().required(),
})

const bodySchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional().allow('', null),
  issued_at: Joi.string().isoDate().optional().allow(null),
  expires_at: Joi.string().isoDate().optional().allow(null),
})

/**
 * @swagger
 * /certificate/other/{userId}/{certId}:
 *   patch:
 *     summary: Zertifikat eines anderen Benutzers aktualisieren
 *     description: Aktualisiert die Metadaten eines Zertifikats eines bestimmten Benutzers. Nur für HR-Berechtigte.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *                 nullable: true
 *               issued_at:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *               expires_at:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Zertifikat erfolgreich aktualisiert
 *       404:
 *         description: Zertifikat nicht gefunden
 *       400:
 *         description: Validierungsfehler
 *       500:
 *         description: Serverfehler
 */
export const updateCertificateForUser: UserRequestHandler = async (req, res, next) => {
  try {
    const { userId, certId } = await paramSchema.validateAsync(req.params)
    const body = await bodySchema.validateAsync(req.body)

    const certificate = await AppDataSource.getRepository(Certificate).findOne({
      where: { id: certId, user: { id: userId } },
    })

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Zertifikat nicht gefunden.' })
    }

    const targetUser = await AppDataSource.getRepository(User).findOne({
      where: {
        id: userId,
      },
      relations: {
        certificates: true,
        department: true
      }
    })

    //* < Block to determine allowed Scope per route >
    const isScopeAllowed = await checkPermissionScope({
      requestingUserId: req.user.id,
      allowedScope: req.maxTargetPermissionScope,
      resolveTargetUserId: () => targetUser?.id,
      resolveTargetDepartmentId: () => targetUser?.department.id,
    })

    if (!isScopeAllowed) {
      return res.status(403).json({ success: false, message: "Keine Berechtigung für diese Aktion." })
    }
    //* < /Block to determine allowed Scope per route >

    await AppDataSource.getRepository(Certificate).update({ id: certId }, {
      ...(body.title && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.issued_at !== undefined && { issued_at: body.issued_at ? new Date(body.issued_at) : null }),
      ...(body.expires_at !== undefined && { expires_at: body.expires_at ? new Date(body.expires_at) : null }),
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    next(error)
  }
}