import path from 'path'
import fs from 'fs'
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { Certificate } from "../../../entity/Certificate"
import Joi from 'joi'
import multer from 'multer'

const paramSchema = Joi.object({
  userId: Joi.string().uuid().required(),
})

const bodySchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional().allow('', null),
  issued_at: Joi.string().isoDate().optional().allow(null),
  expires_at: Joi.string().isoDate().optional().allow(null),
})

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const userId = req.params.userId as string
    const dir = path.join(process.cwd(), 'uploads', 'certificates', userId)  // nur der Ordner
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    cb(null, file.originalname)  // Dateiname wird hier gesetzt
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Nur PDF-Dateien sind erlaubt.'))
    }
    cb(null, true)
  },
})

export const uploadCertificateMiddleware = upload.single('file')

/**
 * @swagger
 * /certificate/other/{userId}/create:
 *   post:
 *     summary: Zertifikat für einen anderen Benutzer erstellen
 *     description: Lädt ein PDF-Zertifikat für einen bestimmten Benutzer hoch. Nur für HR-Berechtigte.
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
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - title
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               issued_at:
 *                 type: string
 *                 format: date
 *               expires_at:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Zertifikat erfolgreich erstellt
 *       400:
 *         description: Validierungsfehler oder keine Datei
 *       500:
 *         description: Serverfehler
 */
export const createCertificateForUser: UserRequestHandler = async (req, res, next) => {
  try {
    const { userId } = await paramSchema.validateAsync(req.params)
    const body = await bodySchema.validateAsync(req.body)

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Keine Datei hochgeladen.' })
    }

    const filePath = path.join('uploads', 'certificates', userId, req.file.originalname)

    const certificate = AppDataSource.getRepository(Certificate).create({
      title: body.title,
      description: body.description ?? null,
      issued_at: body.issued_at ? new Date(body.issued_at) : null,
      expires_at: body.expires_at ? new Date(body.expires_at) : null,
      file_path: filePath,
      user: { id: userId },
    })

    await AppDataSource.getRepository(Certificate).save(certificate)

    return res.status(201).json({
      success: true,
      data: {
        id: certificate.id,
        title: certificate.title,
        description: certificate.description,
        issued_at: certificate.issued_at,
        expires_at: certificate.expires_at,
        created_at: certificate.created_at,
      },
    })
  } catch (error) {
    next(error)
  }
}