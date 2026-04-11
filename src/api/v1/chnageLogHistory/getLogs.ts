import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { ChangeLogHistory } from "../../../entity/ChangeLogHistory"
import { ExistingDatabaseTableNames } from "../../../lib/enums/acessControl.enum"
import Joi from "joi"

const querySchema = Joi.object({
  entity_id: Joi.string().uuid().optional(),
})

/**
 * @swagger
 * /changelog/entity:
 *   get:
 *     summary: Change Logs abrufen
 *     description: Gibt die Änderungshistorie einer bestimmten Entität zurück, sortiert nach Datum absteigend.
 *     tags:
 *       - Change Logs
 *     parameters:
 *       - in: query
 *         name: entity_id
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID der Entität
 *     responses:
 *       200:
 *         description: Change Logs erfolgreich abgerufen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                       entity_table_name:
 *                         type: string
 *                         example: "users"
 *                       entity_id:
 *                         type: string
 *                         format: uuid
 *                         example: "b2c3d4e5-f6a7-8901-bcde-f12345678901"
 *                       action:
 *                         type: string
 *                         example: "UPDATE"
 *                       old_value:
 *                         type: object
 *                         nullable: true
 *                         example: { "first_name": "Max" }
 *                       new_value:
 *                         type: object
 *                         nullable: true
 *                         example: { "first_name": "Moritz" }
 *                       changed_by:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           first_name:
 *                             type: string
 *                             example: "John"
 *                           last_name:
 *                             type: string
 *                             example: "Doe"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-04-11T10:30:00.000Z"
 *       400:
 *         description: Validierungsfehler – ungültiges UUID Format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: '"entity_id" must be a valid GUID'
 *       500:
 *         description: Serverfehler
 */
export const getChangeLogs: UserRequestHandler = async (req, res, next) => {
  try {
    const query = await querySchema.validateAsync(req.query)

    const logs = await AppDataSource.getRepository(ChangeLogHistory).
      find({
        where: {
          entity_id: query.entity_id
        },
        order: { created_at: "DESC" }
      })

    return res.status(200).json({
      success: true,
      data: logs
    })

  } catch (error) {
    if (error instanceof Joi.ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      })
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}