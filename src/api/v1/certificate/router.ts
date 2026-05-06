import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { listCertificates } from './listCertificates';
import { getCertificatesById } from './getCertificateById';
import { listCertificatesByUserId } from './listCertificateByUserId';
import { getCertificateByUserId } from './getCertificateByUserId';
import { createCertificateForUser, uploadCertificateMiddleware } from './createCertificate';
import { updateCertificateForUser } from './updateCertificateByUserid';
import { deleteCertificateForUser } from './deleteCertificateByUserId';


const certificateRouter = Router();

certificateRouter.get('/', listCertificates)
certificateRouter.get('/other/:id', listCertificatesByUserId)

certificateRouter.get('/other/:userId/:certId/file', getCertificateByUserId)
certificateRouter.get('/:id/file', getCertificatesById)

certificateRouter.post('/other/:userId/create', uploadCertificateMiddleware, createCertificateForUser)

certificateRouter.patch('/other/:userId/:certId', updateCertificateForUser)

certificateRouter.delete('/other/:userId/:certId', deleteCertificateForUser)

export default certificateRouter;