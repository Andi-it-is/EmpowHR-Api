import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { getMasterData } from './getMasterData';
import { updateMasterData } from './updateMasterData';

const userMasterDataRouter = Router();

userMasterDataRouter.get('/', getMasterData)
userMasterDataRouter.patch('/', updateMasterData)

export default userMasterDataRouter;