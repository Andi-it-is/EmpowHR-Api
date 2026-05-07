import { User } from "../../../entity/User";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";
import Joi from "joi";
import { PermissionScope } from "../../../lib/enums/acessControl.enum";
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope";

const paramsSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Benutzer abrufen
 *     description: Gibt die Informationen eines Benutzers anhand seiner ID zurück.
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
 *         description: Benutzer erfolgreich abgerufen
 *       400:
 *         description: Validierungsfehler
 *       404:
 *         description: Benutzer nicht gefunden
 *       500:
 *         description: Serverfehler
 */
export const getUserById: UserRequestHandler = async (req, res, next) => {
  try {

    const { error: paramsError, value: params } = paramsSchema.validate(req.params);
    if (paramsError) {
      return res.status(400).json({
        success: false,
        message: paramsError.details[0].message,
      });
    }

    const user = await AppDataSource.getRepository(User)
      .findOne({
        where: { id: params.id },
        relations: {
          department: true,
          supervisor: true,
          roles: true,
        },
      });

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

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User nicht gefunden.",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });

  } catch (error) {
    next(error);
  }
};