import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { listPermissions } from './listPermissions';
import { ExistingEntityNames, PermissionAction } from '../../../lib/enums/acessControl.enum';

const permissionRouter = Router();

permissionRouter.get('/all', permissionChecker(ExistingEntityNames.PERMISSION, PermissionAction.READ), listPermissions)

export default permissionRouter;