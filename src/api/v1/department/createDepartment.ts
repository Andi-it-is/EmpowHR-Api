import { Department } from "../../../entity/Department";
import { User } from "../../../entity/User";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";
import Joi from "joi";

const bodySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  cost_center: Joi.string().min(2).max(20).required(),
  headId: Joi.string().uuid().required(),
  parentId: Joi.string().uuid().required(),
});

/**
 * @swagger
 * /department:
 *   post:
 *     summary: Abteilung erstellen
 *     description: Erstellt eine neue Abteilung.
 *     tags:
 *       - Department
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "IT"
 *               cost_center:
 *                 type: string
 *                 example: "CC_4000"
 *               headId:
 *                 type: string
 *                 format: uuid
 *               parentId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Abteilung erfolgreich erstellt
 *       400:
 *         description: Validierungsfehler
 *       404:
 *         description: Head oder Parent nicht gefunden
 *       500:
 *         description: Serverfehler
 */
export const createDepartment: UserRequestHandler = async (req, res, next) => {
  try {

    const { error: bodyError, value: body } = bodySchema.validate(req.body, { abortEarly: false });
    if (bodyError) {
      return res.status(400).json({
        success: false,
        message: bodyError.details.map(d => d.message),
      });
    }

    const departmentRepo = AppDataSource.getRepository(Department);

    const department = departmentRepo.create({
      name: body.name,
      cost_center: body.cost_center,
    });

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
      const parent = await departmentRepo.findOne({ where: { id: body.parentId } });
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: "Angegebene übergeordnete Abteilung nicht gefunden.",
        });
      }
      department.parent = parent;
    }

    const created = await departmentRepo.save(department);

    return res.status(201).json({
      success: true,
      data: created,
    });

  } catch (error) {
    next(error);
  }
};