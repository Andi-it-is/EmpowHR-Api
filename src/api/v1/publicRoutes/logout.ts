import { RequestHandler } from "express"

/**
 * @swagger
 * /public/logout:
 *   post:
 *     summary: Logout
 *     description: Meldet den Benutzer ab und löscht den Access Token Cookie
 *     tags:
 *       - Public
 *     responses:
 *       200:
 *         description: Erfolgreich abgemeldet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Erfolgreich abgemeldet.
 *       500:
 *         description: Serverfehler
 */
export const logout: RequestHandler = async (req, res, next) => {
  try {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })

    return res.status(200).json({
      success: true,
      message: 'Erfolgreich abgemeldet.'
    })
  } catch (error) {
    next(error)
  }
}