import { User } from "../../../entity/User";
import { Role } from "../../../entity/Role";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";
import Joi from "joi";
import { RoleName } from "../../../lib/enums/acessControl.enum";

const paramsSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const bodySchema = Joi.object({
  roles: Joi.array().items(Joi.string().valid(...Object.values(RoleName))).required(),
});

/**
 * @swagger
 * /user/{id}/roles:
 *   patch:
 *     summary: Rollen eines Benutzers aktualisieren
 *     description: Ersetzt die Rollenzuweisungen eines Benutzers.
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roles
 *             properties:
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [EMPLOYEE, DEPARTMENT_HEAD, HR_MANAGER, ACCOUNTANT, DEMO, IT_ADMINISTRATOR, EXECUTIVE]
 *     responses:
 *       200:
 *         description: Rollen erfolgreich aktualisiert
 *       400:
 *         description: Validierungsfehler
 *       404:
 *         description: Benutzer nicht gefunden
 *       500:
 *         description: Serverfehler
 */
export const updateUserRolesByUserId: UserRequestHandler = async (req, res, next) => {
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
    const roleRepo = AppDataSource.getRepository(Role);

    const user = await userRepo.findOne({
      where: { id: params.id },
      relations: { roles: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User nicht gefunden.",
      });
    }

    const roles = await roleRepo.findBy(
      body.roles.map((name: RoleName) => ({ name }))
    );

    user.roles = roles;
    const updated = await userRepo.save(user);

    return res.status(200).json({
      success: true,
      data: updated,
    });

  } catch (error) {
    next(error);
  }
};