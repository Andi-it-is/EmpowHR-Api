import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { getMasterData } from './getMasterData';
import { updateMasterData } from './updateMasterData';
import { getMasterDataById } from './getMasterDataById';
import { updateMasterDataById } from './updateMasterDataById';

const userMasterDataRouter = Router();

userMasterDataRouter.get('/', getMasterData)

userMasterDataRouter.get('/:id', getMasterDataById)
userMasterDataRouter.patch('/', updateMasterData)
userMasterDataRouter.patch('/:id', updateMasterDataById)


export default userMasterDataRouter;