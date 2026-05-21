import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { getMasterData } from './getMasterData';
import { updateMasterData } from './updateMasterData';
import { getMasterDataById } from './getMasterDataById';
import { updateMasterDataById } from './updateMasterDataById';
import { ExistingEntityNames, PermissionAction } from '../../../lib/enums/acessControl.enum';

const userMasterDataRouter = Router();

userMasterDataRouter.get('/', permissionChecker(ExistingEntityNames.USER_MASTER_DATA, PermissionAction.READ), getMasterData)

userMasterDataRouter.get('/:id', permissionChecker(ExistingEntityNames.USER_MASTER_DATA, PermissionAction.READ), getMasterDataById)

userMasterDataRouter.patch('/', permissionChecker(ExistingEntityNames.USER_MASTER_DATA, PermissionAction.UPDATE), updateMasterData)
userMasterDataRouter.patch('/:id', permissionChecker(ExistingEntityNames.USER_MASTER_DATA, PermissionAction.UPDATE), updateMasterDataById)


export default userMasterDataRouter;