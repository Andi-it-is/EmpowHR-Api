
import { RequestHandler } from "express"
import { AppDataSource } from "../../../AppDataSource"
import { User } from "../../../entity/User"
import { Token } from "../../../entity/Token"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import Joi from "joi"
import { TokenType } from "../../../lib/enums/tokenType.enum"

export const bodySchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authentifiziert einen User und gibt Tokens zurück
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: max@firma.de
 *               password:
 *                 type: string
 *                 example: sicheresPasswort123
 *     responses:
 *       200:
 *         description: Erfolgreich eingeloggt
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
 *                     access_token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     expires_in:
 *                       type: integer
 *                       example: 3600
 *       400:
 *         description: Validierungsfehler
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
 *                   example: Validation Error
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['"email" must be a valid email']
 *       401:
 *         description: Ungültige Anmeldedaten
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
 *                   example: Ungültige Anmeldedaten.
 *       404:
 *         description: User nicht gefunden
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
 *                   example: User mit der Email konnte nicht gefunden werden.
 *       500:
 *         description: Serverfehler
 */
export const login: RequestHandler = async (req, res, next) => {
  try {

    const body = await bodySchema.validateAsync(req.body)

    // User suchen
    const user = await AppDataSource.getRepository(User)
      .findOne({
        where: {
          email: body.email
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          password_hash: true,  // explizit mit auswählen :)
          failed_login_attempts: true,
          disabled: true,
          roles: true,
          department: true
        },
        relations: {
          roles: true,
          department: true
        }
      })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User mit der Email konnte nicht gefunden werden."
      })
    }

    // Passwort prüfen
    const passwordValid = await bcrypt.compare(body.password, user.password_hash)
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Ungültige Anmeldedaten."
      })
    }

    // Access Token generieren
    const accessTokenExpiry = new Date()
    accessTokenExpiry.setMinutes(accessTokenExpiry.getMinutes() + 6000000)

    const accessTokenJwt = jwt.sign(
      {
        userId: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        roles: user.roles.map(r => r.name),
        department: user.department?.name ?? null
      },
      process.env.JWT_ACCESS_TOKEN_SECRET!,
      { expiresIn: "6000000m" }
    )

    // Refresh Token generieren
    const refreshTokenExpiry = new Date()
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7)

    const refreshTokenJwt = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_TOKEN_SECRET!,
      { expiresIn: "70d" }
    )

    // Refresh Token in DB speichern
    const refreshToken = new Token()
    refreshToken.user = user
    refreshToken.type = TokenType.REFRESH
    refreshToken.valid_until = refreshTokenExpiry
    refreshToken.last_used = new Date()

    await AppDataSource.manager.save(Token, refreshToken)

    // Access Token in DB speichern
    const accessToken = new Token()
    accessToken.user = user
    accessToken.type = TokenType.ACCESS
    accessToken.valid_until = accessTokenExpiry
    accessToken.parent_token = refreshToken

    await AppDataSource.manager.save(Token, accessToken)


    return res.status(200).json({
      success: true,
      data: {
        access_token: accessTokenJwt,
        expires_in: 6000000,
      }
    })

  } catch (error: any) {
    if (error.isJoi) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: error.details.map((detail: any) => detail.message)
      })
    }
    next(error)
  }
}