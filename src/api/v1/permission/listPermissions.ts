import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { Permission } from "../../../entity/Permission"

export const listPermissions: UserRequestHandler = async (req, res, next) => {
  try {
    const permissions = await AppDataSource.getRepository(Permission).find()

    return res.status(200).json({
      success: true,
      data: permissions,
    })

  } catch (error) {
    next(error)
  }
}