import { Department } from "../../../entity/Department";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";
import Joi from "joi";
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope";

const paramsSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

/**
 * @swagger
 * /department/{id}:
 *   delete:
 *     summary: Abteilung löschen
 *     description: Löscht eine Abteilung anhand ihrer ID.
 *     tags:
 *       - Department
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Abteilung erfolgreich gelöscht
 *       400:
 *         description: Validierungsfehler
 *       404:
 *         description: Abteilung nicht gefunden
 *       500:
 *         description: Serverfehler
 */
export const deleteDepartmentById: UserRequestHandler = async (req, res, next) => {
  try {

    const { error: paramsError, value: params } = paramsSchema.validate(req.params);
    if (paramsError) {
      return res.status(400).json({
        success: false,
        message: paramsError.details[0].message,
      });
    }

    const departmentRepo = AppDataSource.getRepository(Department);

    const department = await departmentRepo.findOne({
      where: { id: params.id },
      relations: { children: true },
    });

    //* < Block to determine allowed Scope per route >
    const isScopeAllowed = await checkPermissionScope({
      requestingUserId: req.user.id,
      allowedScope: req.maxTargetPermissionScope,
      resolveTargetUserId: () => req.user.id,
      resolveTargetDepartmentId: () => req.user.department.id,
    })

    if (!isScopeAllowed) {
      return res.status(403).json({ success: false, message: "Keine Berechtigung für diese Aktion." })
    }
    //* < /Block to determine allowed Scope per route >

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Abteilung nicht gefunden.",
      });
    }

    if (department.children?.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Abteilung kann nicht gelöscht werden, da ihr untergeordnete Abteilungen zugewiesen sind.",
      });
    }

    await departmentRepo.remove(department);

    return res.status(200).json({
      success: true,
      message: "Abteilung erfolgreich gelöscht.",
    });

  } catch (error) {
    next(error);
  }
};