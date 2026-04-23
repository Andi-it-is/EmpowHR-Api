import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { listPermissions } from './listPermissions';

const permissionRouter = Router();

permissionRouter.get('/all', listPermissions)

export default permissionRouter;