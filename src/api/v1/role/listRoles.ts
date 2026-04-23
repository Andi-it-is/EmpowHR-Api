import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { Role } from "../../../entity/Role"

export const listRoles: UserRequestHandler = async (req, res, next) => {
  try {
    const roles = await AppDataSource.getRepository(Role).find({
      relations: {
        permissions: true
      }
    })

    return res.status(200).json({
      success: true,
      data: roles
    })

  } catch (error) {
    next(error)
  }
}