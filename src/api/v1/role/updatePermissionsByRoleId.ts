// PATCH /roles/:id/permissions
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { Role } from "../../../entity/Role"
import { Permission } from "../../../entity/Permission"
import Joi from 'joi'
import { In } from "typeorm"

const paramSchema = Joi.object({
  id: Joi.string().uuid().required()
})

const bodySchema = Joi.object({
  permissionIds: Joi.array().items(Joi.string().uuid()).required()
})

export const updatePermissionsByRoleId: UserRequestHandler = async (req, res, next) => {
  try {
    const { permissionIds } = await bodySchema.validateAsync(req.body)

    const roleRepo = AppDataSource.getRepository(Role)
    const permissionRepo = AppDataSource.getRepository(Permission)

    const role = await roleRepo.findOne({
      where: { id: req.params.id as string },
      relations: { permissions: true }
    })

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rolle nicht gefunden.',
      })
    }

    const permissions = await permissionRepo.findBy({
      id: In(permissionIds)
    })

    role.permissions = permissions
    await roleRepo.save(role)

    return res.status(200).json({
      success: true,
      data: role,
    })

  } catch (error) {
    next(error)
  }
}