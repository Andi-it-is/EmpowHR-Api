import { Router } from "express";
import v1Router from './v1/v1Router';
// import { tokenChecker } from '../lib/tokenChecker'; // Adjust path if needed

const versionRouter = Router();

versionRouter.use('/api/v1', v1Router)


export default versionRouter;