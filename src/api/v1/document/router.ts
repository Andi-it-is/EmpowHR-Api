import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { listDocuments } from './listDocuments';
import { getDocumentById } from './getDocumentById';
import { listDocumentsByFilters } from './listDocumentsByFilters';
import { uploadDocument, upload } from './uploadDocument';

const documentRouter = Router();

documentRouter.get('/my', listDocuments)
documentRouter.post('/my/filter', listDocumentsByFilters)
documentRouter.post('/my/upload', upload.single('file'), uploadDocument)

documentRouter.get('/:id/file', getDocumentById)

export default documentRouter;