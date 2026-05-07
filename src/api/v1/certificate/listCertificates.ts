import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { Document } from "../../../entity/Document"
import Joi from 'joi'
import { DocumentSecurityLevel, DocumentType } from "../../../lib/enums/acessControl.enum"
import { Certificate } from "../../../entity/Certificate"
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope"

/**
 * @swagger
 * /certificate:
 *   get:
 *     summary: Zertifikate abrufen
 *     description: Gibt alle Zertifikate des eingeloggten Benutzers zurück, sortiert nach Erstellungsdatum absteigend.
 *     tags:
 *       - Certificates
 *     responses:
 *       200:
 *         description: Zertifikate erfolgreich abgerufen
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
 *                         example: "AWS Certified Developer"
 *                       description:
 *                         type: string
 *                         nullable: true
 *                         example: "Amazon Web Services Zertifizierung"
 *                       issued_at:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: "2024-01-15T00:00:00.000Z"
 *                       expires_at:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: "2027-01-15T00:00:00.000Z"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-04-11T10:30:00.000Z"
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-04-11T10:30:00.000Z"
 *       500:
 *         description: Serverfehler
 */
export const listCertificates: UserRequestHandler = async (req, res, next) => {
  try {
    const id = req.user.id

    const certificates = await AppDataSource.getRepository(Certificate).find({
      where: { user: { id } },
      select: {
        id: true,
        title: true,
        description: true,
        // file_path bewusst weggelassen
        issued_at: true,
        expires_at: true,
        created_at: true,
        updated_at: true,
        user: true
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
      data: certificates
    })

  } catch (error) {
    next(error)
  }
}