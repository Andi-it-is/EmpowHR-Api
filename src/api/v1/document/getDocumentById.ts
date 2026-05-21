import path from 'path'
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { Document } from "../../../entity/Document"
import Joi from 'joi'
import { checkPermissionScope } from '../../../lib/helpers/checkPermissionScope'


export const paramSchema = Joi.object({
  id: Joi.string().required(),
})

/**
 * @swagger
 * /document/{id}/file:
 *   get:
 *     summary: Dokument als PDF abrufen
 *     description: Gibt das PDF eines bestimmten Dokuments des eingeloggten Benutzers zurück.
 *     tags:
 *       - Documents
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID des Dokuments
 *     responses:
 *       200:
 *         description: PDF erfolgreich zurückgegeben
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Dokument nicht gefunden
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
export const getDocumentById: UserRequestHandler = async (req, res, next) => {
  try {

    const params = await paramSchema.validateAsync(req.params)

    const doc = await AppDataSource.getRepository(Document).findOne({
      where: {
        id: params.id,
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

    if (!doc) return res.status(404).json({ success: false, message: 'Nicht gefunden' })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${doc.title}.pdf"`)
    res.sendFile(path.resolve(doc.file_path))

  } catch (error) {
    next(error)
  }
}