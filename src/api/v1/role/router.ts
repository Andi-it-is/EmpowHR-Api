import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { listRoles } from './listRoles';
import { updatePermissionsByRoleId } from './updatePermissionsByRoleId';

const rolesRouter = Router();

rolesRouter.get('/all', listRoles)
rolesRouter.patch('/:id/permissions', updatePermissionsByRoleId)

export default rolesRouter;