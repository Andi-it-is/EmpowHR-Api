import { User } from "../../../entity/User";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";
import Joi from "joi";

const paramsSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const bodySchema = Joi.object({
  firstname: Joi.string().min(2).max(50).optional(),
  lastname: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional(),
  disabled: Joi.boolean().optional(),
  departmentId: Joi.string().uuid().allow(null),
});

/**
 * @swagger
 * /user/{id}:
 *   patch:
 *     summary: Benutzer aktualisieren
 *     description: Aktualisiert die Daten eines Benutzers anhand seiner ID.
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Benutzer erfolgreich aktualisiert
 *       400:
 *         description: Validierungsfehler
 *       404:
 *         description: Benutzer nicht gefunden
 *       500:
 *         description: Serverfehler
 */
export const updateUserById: UserRequestHandler = async (req, res, next) => {
  try {

    const { error: paramsError, value: params } = paramsSchema.validate(req.params);

    if (paramsError) {
      return res.status(400).json({
        success: false,
        message: paramsError.details[0].message,
      });
    }

    const { error: bodyError, value: body } = bodySchema.validate(req.body, { abortEarly: false });
    if (bodyError) {
      return res.status(400).json({
        success: false,
        message: bodyError.details.map(d => d.message),
      });
    }

    const userRepo = AppDataSource.getRepository(User);

    const user = await userRepo.findOne({ where: { id: params.id } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User nicht gefunden.",
      });
    }

    const { departmentId, ...rest } = body

    Object.assign(user, body);

    if (departmentId !== undefined) {
      user.department = departmentId ? { id: departmentId } as any : null
    }

    const updated = await userRepo.save(user);

    return res.status(200).json({
      success: true,
      data: updated,
    });

  } catch (error) {
    next(error);
  }
};