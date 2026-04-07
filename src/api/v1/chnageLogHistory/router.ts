import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { getChangeLogs } from './getLogs';


const changeLogRouter = Router();

changeLogRouter.get('/entity', getChangeLogs)

export default changeLogRouter;