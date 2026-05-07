import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { listDocuments } from './listDocuments';
import { getDocumentById } from './getDocumentById';
import { listDocumentsByFilters } from './listDocumentsByFilters';
import { uploadDocument, upload } from './uploadDocument';
import { listDocumentsByUserId } from './listDocumentsByUserId';
import { uploadDocumentByUserId, uploadDocumentMiddleware } from './uploadDocumentByUserId';
import { updateDocumentByUserId } from './updateDocumentyByUserId';
import { deleteDocumentByUserId } from './deleteDocumentByUserId';
import { ExistingEntityNames, PermissionAction } from '../../../lib/enums/acessControl.enum';

const documentRouter = Router();

documentRouter.get('/my', permissionChecker(ExistingEntityNames.DOCUMENT, PermissionAction.READ), listDocuments)
documentRouter.post('/my/filter', permissionChecker(ExistingEntityNames.DOCUMENT, PermissionAction.READ), listDocumentsByFilters)

documentRouter.post('/my/upload', permissionChecker(ExistingEntityNames.DOCUMENT, PermissionAction.CREATE), upload.single('file'), uploadDocument)
documentRouter.post('/other/:userId/upload', permissionChecker(ExistingEntityNames.DOCUMENT, PermissionAction.CREATE), uploadDocumentMiddleware, uploadDocumentByUserId)

documentRouter.get('/other/:id', permissionChecker(ExistingEntityNames.DOCUMENT, PermissionAction.READ), listDocumentsByUserId)
documentRouter.get('/:id/file', permissionChecker(ExistingEntityNames.DOCUMENT, PermissionAction.READ), getDocumentById)

documentRouter.patch('/other/:userId/:documentId', permissionChecker(ExistingEntityNames.DOCUMENT, PermissionAction.UPDATE), updateDocumentByUserId)
documentRouter.delete('/other/:userId/:documentId', permissionChecker(ExistingEntityNames.DOCUMENT, PermissionAction.DELETE), deleteDocumentByUserId)

export default documentRouter;