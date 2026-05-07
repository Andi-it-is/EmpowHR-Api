import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { getMyTimeAccount } from './getTimeAccount';
import { ExistingEntityNames, PermissionAction } from '../../../lib/enums/acessControl.enum';

const userTimeAccountRouter = Router();

userTimeAccountRouter.get('/my', permissionChecker(ExistingEntityNames.USER_TIME_ACCOUNT, PermissionAction.READ), getMyTimeAccount)

export default userTimeAccountRouter;