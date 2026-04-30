import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { getSimpleUserInfo } from './getSimpleUserInfo';
import { listAllUsers } from './listUsers';
import { updateUserById } from './updateUserById';
import { deleteUserById } from './deleteUserById';
import { updateUserRolesByUserId } from './updateUserRolesByUserId';
import { ExistingEntityNames, PermissionAction, PermissionScope } from '../../../lib/enums/acessControl.enum';
import { getUserById } from './getUserById';
import { createFullUser } from './createFullUser';

const userRouter = Router();

userRouter.get('/simple', getSimpleUserInfo)

userRouter.get('/all', permissionChecker(ExistingEntityNames.USER, PermissionAction.READ), listAllUsers)

userRouter.post('/create', permissionChecker(ExistingEntityNames.USER, PermissionAction.CREATE), createFullUser)
userRouter.get('/:id', permissionChecker(ExistingEntityNames.USER, PermissionAction.READ), getUserById)

userRouter.patch('/:id', updateUserById)
userRouter.patch('/:id/roles', updateUserRolesByUserId)

userRouter.delete('/:id', deleteUserById)
export default userRouter;