import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { getSimpleUserInfo } from './getSimpleUserInfo';

const userRouter = Router();

userRouter.get('/simple', permissionChecker("hier muss die benötigte Berechtigung hin, welche für das Ausführen dieser Route benötigt wird."), getSimpleUserInfo)

export default userRouter;