// controller/user.controller.ts

import { RequestHandler } from "express"
import { AppDataSource } from "../../../AppDataSource"
import { User } from "../../../entity/User"

/**
 * @swagger
 * /testme:
 *   post:
 *     summary: Erstellt einen neuen User
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - email
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: Max
 *               last_name:
 *                 type: string
 *                 example: Mustermann
 *               email:
 *                 type: string
 *                 example: max@firma.de
 *     responses:
 *       201:
 *         description: User erfolgreich erstellt
 *       400:
 *         description: Fehlende Pflichtfelder
 *       409:
 *         description: E-Mail bereits vergeben
 *       500:
 *         description: Serverfehler
 */
export const createUser: RequestHandler = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password } = req.body

    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        success: false,
        message: "first_name, last_name und email sind Pflichtfelder."
      })
    }

    const user = new User()

    user.firstname = first_name
    user.lastname = last_name
    user.email = email
    user.password_hash = password

    const saved = await AppDataSource.manager.save(user)

    return res.status(201).json({
      success: true,
      data: saved
    })

  } catch (error) {
    next(error)
  }
}