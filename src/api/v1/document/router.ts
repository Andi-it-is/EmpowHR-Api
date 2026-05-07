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

const documentRouter = Router();

documentRouter.get('/my', listDocuments)
documentRouter.post('/my/filter', listDocumentsByFilters)

documentRouter.post('/my/upload', upload.single('file'), uploadDocument)
documentRouter.post('/other/:userId/upload', uploadDocumentMiddleware, uploadDocumentByUserId)

documentRouter.get('/other/:id', listDocumentsByUserId)
documentRouter.get('/:id/file', getDocumentById)

documentRouter.patch('/other/:userId/:documentId', updateDocumentByUserId)
documentRouter.delete('/other/:userId/:documentId', deleteDocumentByUserId)

export default documentRouter;