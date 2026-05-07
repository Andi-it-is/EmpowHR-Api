import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { Document } from "../../../entity/Document"
import Joi from 'joi'
import { DocumentSecurityLevel, DocumentType } from "../../../lib/enums/acessControl.enum"
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope"


/**
 * @swagger
 * /document/my:
 *   get:
 *     summary: Dokumente abrufen
 *     description: Gibt alle Dokumente des eingeloggten Benutzers zurück, sortiert nach Erstellungsdatum absteigend.
 *     tags:
 *       - Documents
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
 *       500:
 *         description: Serverfehler
 */
export const listDocuments: UserRequestHandler = async (req, res, next) => {
  try {
    const id = req.user.id

    const documents = await AppDataSource.getRepository(Document).find({
      where: { user: { id } },
      select: {
        id: true,
        title: true,
        type: true,
        security_level: true,
        created_at: true,
        updated_at: true,
        // file_path bewusst weggelassen
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
      data: documents
    })

  } catch (error) {
    next(error)
  }
}