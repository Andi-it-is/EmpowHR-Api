import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { Document } from "../../../entity/Document"
import { DocumentSecurityLevel, DocumentType } from "../../../lib/enums/acessControl.enum"
import Joi from 'joi'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, '../../../../uploads/documents')
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (_req, _file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${unique}.pdf`)
  }
})

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true)
  } else {
    cb(new Error('Nur PDF-Dateien sind erlaubt'))
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
})

const bodySchema = Joi.object({
  title: Joi.string().max(255).required(),
  type: Joi.string().valid(...Object.values(DocumentType)).required(),
  security_level: Joi.number()
    .valid(...Object.values(DocumentSecurityLevel).filter(v => typeof v === 'number'))
    .required(),
})

/**
 * @swagger
 * /document/my/upload:
 *   post:
 *     summary: Dokument hochladen
 *     description: Lädt ein PDF-Dokument für den eingeloggten Benutzer hoch. Nur PDF-Dateien sind erlaubt, maximale Dateigröße beträgt 10 MB.
 *     tags:
 *       - Documents
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
 *                 description: PDF-Datei (max. 10 MB)
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 example: "Arbeitsvertrag 2025"
 *               type:
 *                 type: string
 *                 enum: [CONTRACT, FINANCE, ABSENCE, QUALIFICATION, COMPLIANCE]
 *                 example: "CONTRACT"
 *               security_level:
 *                 type: integer
 *                 enum: [1, 2, 3, 4]
 *                 description: "1 = RESTRICTED, 2 = CONFIDENTIAL, 3 = SECRET, 4 = TOP_SECRET"
 *                 example: 1
 *     responses:
 *       201:
 *         description: Dokument erfolgreich hochgeladen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     title:
 *                       type: string
 *                       example: "Arbeitsvertrag 2025"
 *                     type:
 *                       type: string
 *                       enum: [CONTRACT, FINANCE, ABSENCE, QUALIFICATION, COMPLIANCE]
 *                       example: "CONTRACT"
 *                     security_level:
 *                       type: integer
 *                       enum: [1, 2, 3, 4]
 *                       example: 1
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-04-11T10:30:00.000Z"
 *       400:
 *         description: Validierungsfehler oder ungültiger Dateityp
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
 *                   example: "Nur PDF-Dateien sind erlaubt"
 *       500:
 *         description: Serverfehler
 */
export const uploadDocument: UserRequestHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Keine Datei hochgeladen' })
    }

    const { title, type, security_level } = await bodySchema.validateAsync(req.body)

    const document = AppDataSource.getRepository(Document).create({
      title,
      type,
      security_level,
      file_path: req.file.path,
      user: { id: req.user.id },
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