import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { ChangeLogHistory } from "../../../entity/ChangeLogHistory"
import { ExistingDatabaseTableNames } from "../../../lib/enums/acessControl.enum"
import Joi from "joi"

const querySchema = Joi.object({
  entity_id: Joi.string().uuid().optional(),
})

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
    next(error)
  }
}