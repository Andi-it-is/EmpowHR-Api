import path from 'path'
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import Joi from 'joi'
import { Certificate } from '../../../entity/Certificate'
import { checkPermissionScope } from '../../../lib/helpers/checkPermissionScope'


export const paramSchema = Joi.object({
  id: Joi.string().required(),
})

/**
 * @swagger
 * /certificate/{id}/file:
 *   get:
 *     summary: Zertifikat als PDF abrufen
 *     description: Gibt das PDF eines bestimmten Zertifikats des eingeloggten Benutzers zurück.
 *     tags:
 *       - Certificates
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID des Zertifikats
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
 *                   example: "Nicht gefunden"
 *       400:
 *         description: Validierungsfehler – ID fehlt
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
 *                   example: '"id" is not allowed to be empty'
 *       500:
 *         description: Serverfehler
 */
export const getCertificatesById: UserRequestHandler = async (req, res, next) => {
  try {

    const params = await paramSchema.validateAsync(req.params)

    const certificate = await AppDataSource.getRepository(Certificate).findOne({
      where: {
        id: params.id,
        user: { id: req.user.id }
      },
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

    if (!certificate) return res.status(404).json({ success: false, message: 'Nicht gefunden' })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${certificate.title}.pdf"`)
    res.sendFile(path.join(process.cwd(), certificate.file_path))

  } catch (error) {
    next(error)
  }
}