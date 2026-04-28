import { Department } from "../../../entity/Department";
import { User } from "../../../entity/User";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";
import Joi from "joi";

const paramsSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const bodySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  cost_center: Joi.string().min(2).max(20).optional(),
  headId: Joi.string().uuid().optional(),
  parentId: Joi.string().uuid().optional(),
});

/**
 * @swagger
 * /department/{id}:
 *   patch:
 *     summary: Abteilung aktualisieren
 *     description: Aktualisiert die Daten einer Abteilung anhand ihrer ID.
 *     tags:
 *       - Department
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
 *               name:
 *                 type: string
 *               cost_center:
 *                 type: string
 *               headId:
 *                 type: string
 *                 format: uuid
 *               parentId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Abteilung erfolgreich aktualisiert
 *       400:
 *         description: Validierungsfehler
 *       404:
 *         description: Abteilung, Head oder Parent nicht gefunden
 *       500:
 *         description: Serverfehler
 */
export const updateDepartmentById: UserRequestHandler = async (req, res, next) => {
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

    const departmentRepo = AppDataSource.getRepository(Department);

    const department = await departmentRepo.findOne({
      where: { id: params.id },
      relations: { head: true, parent: true },
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Abteilung nicht gefunden.",
      });
    }

    if (body.name) department.name = body.name;
    if (body.cost_center) department.cost_center = body.cost_center;

    if (body.headId) {
      const head = await AppDataSource.getRepository(User).findOne({ where: { id: body.headId } });
      if (!head) {
        return res.status(404).json({
          success: false,
          message: "Angegebener Abteilungsleiter nicht gefunden.",
        });
      }
      department.head = head;
    }

    if (body.parentId) {
      if (body.parentId === params.id) {
        return res.status(400).json({
          success: false,
          message: "Eine Abteilung kann nicht ihr eigenes Parent sein.",
        });
      }
      const parent = await departmentRepo.findOne({ where: { id: body.parentId } });
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: "Angegebene übergeordnete Abteilung nicht gefunden.",
        });
      }
      department.parent = parent;
    }

    const updated = await departmentRepo.save(department);

    return res.status(200).json({
      success: true,
      data: updated,
    });

  } catch (error) {
    next(error);
  }
};