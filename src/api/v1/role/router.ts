import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { listRoles } from './listRoles';
import { updatePermissionsByRoleId } from './updatePermissionsByRoleId';
import { ExistingEntityNames, PermissionAction } from '../../../lib/enums/acessControl.enum';

const rolesRouter = Router();

rolesRouter.get('/all', permissionChecker(ExistingEntityNames.ROLE, PermissionAction.READ), listRoles)
rolesRouter.patch('/:id/permissions', permissionChecker(ExistingEntityNames.ROLE, PermissionAction.UPDATE), updatePermissionsByRoleId)

export default rolesRouter;