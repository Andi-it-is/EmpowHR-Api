import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { getSimpleUserInfo } from './getSimpleUserInfo';
import { listAllUsers } from './listUsers';

const userRouter = Router();

userRouter.get('/simple', permissionChecker("hier muss die benötigte Berechtigung hin, welche für das Ausführen dieser Route benötigt wird."), getSimpleUserInfo)

userRouter.get('/all', listAllUsers)

export default userRouter;