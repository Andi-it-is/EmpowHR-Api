// PATCH /roles/:id/permissions
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { Role } from "../../../entity/Role"
import { Permission } from "../../../entity/Permission"
import Joi from 'joi'
import { In } from "typeorm"
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope"

const paramSchema = Joi.object({
  id: Joi.string().uuid().required()
})

const bodySchema = Joi.object({
  permissionIds: Joi.array().items(Joi.string().uuid()).required()
})


/**
 * @swagger
 * /role/{id}/permissions:
 *   patch:
 *     summary: Berechtigungen einer Rolle aktualisieren
 *     description: >
 *       Ersetzt alle bestehenden Berechtigungen einer Rolle vollständig durch die übergebenen.
 *       Berechtigungen die nicht in der Liste enthalten sind werden entfernt.
 *     tags:
 *       - Role
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID der Rolle
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissionIds
 *             properties:
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: "Liste der neuen Berechtigungs-IDs. Ersetzt alle bisherigen Berechtigungen."
 *                 example: ["a1b2c3d4-...", "e5f6g7h8-..."]
 *     responses:
 *       200:
 *         description: Berechtigungen erfolgreich aktualisiert
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                       enum: [ADMIN, HR_MANAGER, MANAGER, EMPLOYEE]
 *                     max_security_level:
 *                       type: integer
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           entity:
 *                             type: string
 *                             enum: [USER, DEPARTMENT, TIME_ENTRY, ABSENCE, ROLE, PERMISSION]
 *                           action:
 *                             type: string
 *                             enum: [CREATE, READ, UPDATE, DELETE]
 *                           scope:
 *                             type: string
 *                             enum: [OWN, DEPARTMENT, GLOBAL]
 *       400:
 *         description: Validierungsfehler
 *       403:
 *         description: Keine Berechtigung
 *       404:
 *         description: Rolle nicht gefunden
 *       500:
 *         description: Serverfehler
 */
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