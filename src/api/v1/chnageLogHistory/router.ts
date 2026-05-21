import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { getChangeLogs } from './getLogs';
import { ExistingEntityNames, PermissionAction } from '../../../lib/enums/acessControl.enum';


const changeLogRouter = Router();

changeLogRouter.get('/entity', permissionChecker(ExistingEntityNames.USER, PermissionAction.READ), getChangeLogs)

export default changeLogRouter;