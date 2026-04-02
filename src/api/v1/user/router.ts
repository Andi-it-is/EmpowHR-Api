import { Router, Request, Response } from 'express';
import { getAllUsers } from './getAllUsers';
import { authorizeRoles } from '../../../lib/middleware/authorizeRoles';
import { UserRoleEnum } from '../../../lib/enums/UserRoleEnum';

const userRouter = Router();

userRouter.get('/all', authorizeRoles([UserRoleEnum.USER]), getAllUsers)

export default userRouter;