// src/routes/admin/users/resetPassword.ts

import { RequestHandler } from "express"
import { AppDataSource } from "../../../AppDataSource"
import { User } from "../../../entity/User"
import bcrypt from "bcryptjs"
import Joi from "joi"
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope"
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"

export const bodySchema = Joi.object({
  new_password: Joi.string().min(8).max(100).required(),
  new_password_confirm: Joi.string().valid(Joi.ref('new_password')).required()
    .messages({ 'any.only': 'Passwörter stimmen nicht überein.' }),
})

/**
 * @swagger
 * /users/{id}/reset-password:
 *   patch:
 *     summary: Setzt das Passwort eines Users zurück (Admin)
 *     tags:
 *       - Admin / Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID des Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - new_password
 *               - new_password_confirm
 *             properties:
 *               new_password:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 100
 *                 example: NeuesPasswort123!
 *               new_password_confirm:
 *                 type: string
 *                 example: NeuesPasswort123!
 *     responses:
 *       200:
 *         description: Passwort erfolgreich geändert
 *       400:
 *         description: Validierungsfehler
 *       404:
 *         description: User nicht gefunden
 *       500:
 *         description: Serverfehler
 */
export const resetPassword: UserRequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id as string
    const body = await bodySchema.validateAsync(req.body)

    const userRepo = AppDataSource.getRepository(User)

    const user = await userRepo.findOne({ where: { id } })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User nicht gefunden."
      })
    }

    user.password_hash = await bcrypt.hash(body.new_password, 12)
    // Fehlgeschlagene Logins zurücksetzen & Account ggf. entsperren
    user.failed_login_attempts = 0
    user.disabled = false

    //* < Block to determine allowed Scope per route >
    const isScopeAllowed = await checkPermissionScope({
      requestingUserId: req.user.id,
      allowedScope: req.maxTargetPermissionScope,
      resolveTargetUserId: () => user?.id,
      resolveTargetDepartmentId: () => user?.department?.id,
    })

    if (!isScopeAllowed) {
      return res.status(403).json({ success: false, message: "Keine Berechtigung für diese Aktion." })
    }
    //* < /Block to determine allowed Scope per route >

    await userRepo.save(user)

    return res.status(200).json({
      success: true,
      message: `Passwort für ${user.firstname} ${user.lastname} erfolgreich zurückgesetzt.`
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