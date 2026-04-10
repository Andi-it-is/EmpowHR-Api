import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { listCertificates } from './listCertificates';
import { getCertificatesById } from './getCertificateById';


const certificateRouter = Router();

certificateRouter.get('/', listCertificates)
certificateRouter.get('/:id/file', getCertificatesById)

export default certificateRouter;