import { User } from "../../../entity/User";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";
import Joi from "joi";

const paramsSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     summary: Benutzer löschen
 *     description: Löscht einen Benutzer anhand seiner ID.
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Benutzer erfolgreich gelöscht
 *       400:
 *         description: Validierungsfehler
 *       404:
 *         description: Benutzer nicht gefunden
 *       500:
 *         description: Serverfehler
 */
export const deleteUserById: UserRequestHandler = async (req, res, next) => {
  try {

    const { error: paramsError, value: params } = paramsSchema.validate(req.params);
    if (paramsError) {
      return res.status(400).json({
        success: false,
        message: paramsError.details[0].message,
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

    await userRepo.remove(user);

    return res.status(200).json({
      success: true,
      message: "User erfolgreich gelöscht.",
    });

  } catch (error) {
    next(error);
  }
};