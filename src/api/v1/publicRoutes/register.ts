import { RequestHandler } from "express"
import { AppDataSource } from "../../../AppDataSource"
import { User } from "../../../entity/User"
import bcrypt from "bcryptjs"
import Joi from "joi"

export const bodySchema = Joi.object({
  firstname: Joi.string().min(2).max(50).optional(),
  lastname: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(100).required(),
  passwordConfirm: Joi.string().min(8).max(100).required(),
})

/**
 * @swagger
 * /public/register:
 *   post:
 *     summary: Registriert einen neuen User
 *     tags:
 *       - Public
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstname
 *               - lastname
 *               - email
 *               - password
 *             properties:
 *               firstname:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: Max
 *               lastname:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: Mustermann
 *               email:
 *                 type: string
 *                 format: email
 *                 example: max@firma.de
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 100
 *                 example: sicheresPasswort123
 *     responses:
 *       201:
 *         description: User erfolgreich registriert
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
 *                       example: uuid-123
 *                     firstname:
 *                       type: string
 *                       example: Max
 *                     lastname:
 *                       type: string
 *                       example: Mustermann
 *                     email:
 *                       type: string
 *                       example: max@firma.de
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validierungsfehler
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: Validation Error
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['"email" must be a valid email']
 *       409:
 *         description: E-Mail bereits vergeben
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
 *                   example: E-Mail bereits vergeben.
 *       500:
 *         description: Serverfehler
 */
export const register: RequestHandler = async (req, res, next) => {
  try {

    const body = await bodySchema.validateAsync(req.body)

    const existingUser = await AppDataSource.getRepository(User)
      .findOne({
        where: {
          email: body.email
        }
      })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "E-Mail bereits vergeben."
      })
    }

    const password_hash = await bcrypt.hash(body.password, 12)

    const user = new User()


    user.firstname = body.firstname ?? 'Dennis'
    user.lastname = body.lastname ?? 'Demo'
    user.email = body.email
    user.password_hash = password_hash

    const result = await AppDataSource.manager.save(user)
    const { password_hash: _, ...safeResult } = result


    return res.status(201).json({
      success: true,
      data: safeResult
    })

  } catch (error: any) {

    if (error.isJoi) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: error.details.map((detail: any) => detail.message)
      });
    }
    next(error)
  }
}