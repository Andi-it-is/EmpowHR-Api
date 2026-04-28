import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { getSimpleUserInfo } from './getSimpleUserInfo';
import { listAllUsers } from './listUsers';
import { updateUserById } from './updateUserById';
import { deleteUserById } from './deleteUserById';
import { updateUserRolesByUserId } from './updateUserRolesByUserId';
import { ExistingEntityNames, PermissionAction, PermissionScope } from '../../../lib/enums/acessControl.enum';

const userRouter = Router();

userRouter.get('/simple', getSimpleUserInfo)

userRouter.get('/all', permissionChecker(ExistingEntityNames.USER, PermissionAction.READ, PermissionScope.ALL), listAllUsers)

userRouter.patch('/:id', updateUserById)
userRouter.patch('/:id/roles', updateUserRolesByUserId)

userRouter.delete('/:id', deleteUserById)
export default userRouter;