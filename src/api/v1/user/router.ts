import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { getSimpleUserInfo } from './getSimpleUserInfo';
import { listAllUsers } from './listUsers';
import { updateUserById } from './updateUserById';
import { deleteUserById } from './deleteUserById';

const userRouter = Router();

userRouter.get('/simple', permissionChecker("hier muss die benötigte Berechtigung hin, welche für das Ausführen dieser Route benötigt wird."), getSimpleUserInfo)

userRouter.get('/all', listAllUsers)
userRouter.patch('/:id', updateUserById)
userRouter.delete('/:id', deleteUserById)
export default userRouter;