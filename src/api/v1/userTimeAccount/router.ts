import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { getMyTimeAccount } from './getTimeAccount';

const userTimeAccountRouter = Router();

userTimeAccountRouter.get('/my', getMyTimeAccount)

export default userTimeAccountRouter;