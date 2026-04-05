import { Router, Request, Response } from 'express';
import { getUserInfo } from './getUserInfo';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';

const userRouter = Router();

userRouter.get('/:id', permissionChecker("hier muss die benötigte Berechtigung hin, welche für das Ausführen dieser Route benötigt wird."), getUserInfo)

export default userRouter;