import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { Document } from "../../../entity/Document"
import { DocumentSecurityLevel, DocumentType } from "../../../lib/enums/acessControl.enum"
import Joi from 'joi'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope"
import { User } from "../../../entity/User"

const paramsSchema = Joi.object({
  userId: Joi.string().uuid().required()
})

const bodySchema = Joi.object({
  title: Joi.string().max(255).required(),
  type: Joi.string().valid(...Object.values(DocumentType)).required(),
  security_level: Joi.number()
    .valid(...Object.values(DocumentSecurityLevel).filter(v => typeof v === 'number'))
    .required(),
})

// Temp-Ordner — req.params ist hier noch nicht verfügbar auf Windows
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'documents', 'temp')
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    cb(null, file.originalname)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Nur PDF-Dateien sind erlaubt.'))
    }
    cb(null, true)
  },
})

export const uploadDocumentMiddleware = upload.single('file')

/**
 * @swagger
 * /document/user/{id}/upload:
 *   post:
 *     summary: Dokument für einen Benutzer hochladen
 *     description: Lädt ein PDF-Dokument für einen bestimmten Benutzer hoch. Nur für HR-Manager zugänglich.
 *     tags:
 *       - Documents
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID des Zielbenutzers
 *         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, title, type, security_level]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 example: "Arbeitsvertrag 2025"
 *               type:
 *                 type: string
 *                 enum: [CONTRACT, FINANCE, ABSENCE, QUALIFICATION, COMPLIANCE]
 *               security_level:
 *                 type: integer
 *                 enum: [1, 2, 3, 4]
 *     responses:
 *       201:
 *         description: Dokument erfolgreich hochgeladen
 *       400:
 *         description: Validierungsfehler oder ungültige User-ID
 *       404:
 *         description: Benutzer nicht gefunden
 *       500:
 *         description: Serverfehler
 */
export const uploadDocumentByUserId: UserRequestHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Keine Datei hochgeladen' })
    }

    const { userId } = await paramsSchema.validateAsync(req.params)
    const { title, type, security_level } = await bodySchema.validateAsync(req.body)

    const userExisting = await AppDataSource.getRepository(User).findOne({
      where: { id: userId },
      relations: ['department'],
    })

    if (!userExisting) {
      fs.unlink(req.file.path, () => { })
      return res.status(404).json({ success: false, message: 'Benutzer nicht gefunden' })
    }

    //* < Block to determine allowed Scope per route >
    const isScopeAllowed = await checkPermissionScope({
      requestingUserId: req.user.id,
      allowedScope: req.maxTargetPermissionScope,
      resolveTargetUserId: () => userId,
      resolveTargetDepartmentId: () => userExisting.department.id,
    })

    if (!isScopeAllowed) {
      return res.status(403).json({ success: false, message: "Keine Berechtigung für diese Aktion." })
    }
    //* < /Block to determine allowed Scope per route >

    // Datei vom temp-Ordner in den userId-Ordner verschieben
    const targetDir = path.join(process.cwd(), 'uploads', 'documents', userId)
    fs.mkdirSync(targetDir, { recursive: true })

    const targetPath = path.join(targetDir, req.file.originalname)
    fs.copyFileSync(req.file.path, targetPath)
    fs.unlinkSync(req.file.path)

    const filePath = ['uploads', 'documents', userId, req.file.originalname].join('/')

    const document = AppDataSource.getRepository(Document).create({
      title,
      type,
      security_level,
      file_path: filePath,
      user: { id: userId },
    })

    await AppDataSource.getRepository(Document).save(document)

    return res.status(201).json({
      success: true,
      data: {
        id: document.id,
        title: document.title,
        type: document.type,
        security_level: document.security_level,
        created_at: document.created_at,
      }
    })

  } catch (error) {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => { })
    }
    next(error)
  }
}