import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { listCertificates } from './listCertificates';
import { getCertificatesById } from './getCertificateById';
import { listCertificatesByUserId } from './listCertificateByUserId';
import { getCertificateByUserId } from './getCertificateByUserId';
import { createCertificateForUser, uploadCertificateMiddleware } from './createCertificateByUserId';
import { updateCertificateForUser } from './updateCertificateByUserid';
import { deleteCertificateForUser } from './deleteCertificateByUserId';
import { ExistingEntityNames, PermissionAction } from '../../../lib/enums/acessControl.enum';


const certificateRouter = Router();

certificateRouter.get('/', permissionChecker(ExistingEntityNames.CERTIFICATE, PermissionAction.READ), listCertificates)
certificateRouter.get('/other/:id', permissionChecker(ExistingEntityNames.CERTIFICATE, PermissionAction.READ), listCertificatesByUserId)

certificateRouter.get('/other/:userId/:certId/file', permissionChecker(ExistingEntityNames.CERTIFICATE, PermissionAction.READ), getCertificateByUserId)
certificateRouter.get('/:id/file', permissionChecker(ExistingEntityNames.CERTIFICATE, PermissionAction.READ), getCertificatesById)

certificateRouter.post('/other/:userId/create', permissionChecker(ExistingEntityNames.CERTIFICATE, PermissionAction.CREATE), uploadCertificateMiddleware, createCertificateForUser)

certificateRouter.patch('/other/:userId/:certId', permissionChecker(ExistingEntityNames.CERTIFICATE, PermissionAction.UPDATE), updateCertificateForUser)

certificateRouter.delete('/other/:userId/:certId', permissionChecker(ExistingEntityNames.CERTIFICATE, PermissionAction.DELETE), deleteCertificateForUser)

export default certificateRouter;