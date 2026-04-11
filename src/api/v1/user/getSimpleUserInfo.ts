import { User } from "../../../entity/User";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";

/**
 * @swagger
 * /user/simple:
 *   get:
 *     summary: Eigene Benutzerinformationen abrufen
 *     description: Gibt die grundlegenden Informationen des eingeloggten Benutzers zurück.
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: Benutzerinformationen erfolgreich abgerufen
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
 *                     firstname:
 *                       type: string
 *                       example: "Max"
 *                     lastname:
 *                       type: string
 *                       example: "Mustermann"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "max.mustermann@example.com"
 *       404:
 *         description: Benutzer nicht gefunden
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
 *                   example: "User nicht gefunden."
 *       500:
 *         description: Serverfehler
 */
export const getSimpleUserInfo: UserRequestHandler = async (req, res, next) => {
  try {

    const id = req.user.id  // ← kommt aus dem JWT via userTokenChecker

    const user = await AppDataSource.getRepository(User)
      .findOne({
        where: { id },
        select: {
          firstname: true,
          lastname: true,
          email: true,
        }
      })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User nicht gefunden."
      })
    }

    return res.status(200).json({
      success: true,
      data: user
    })

  } catch (error) {
    next(error)
  }
}