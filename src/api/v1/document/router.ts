import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { listDocuments } from './listDocuments';
import { getDocumentById } from './getDocumentById';
import { listDocumentsByFilters } from './listDocumentsByFilters';

const documentRouter = Router();

documentRouter.get('/my', listDocuments)
documentRouter.post('/my/filter', listDocumentsByFilters)

documentRouter.get('/:id/file', getDocumentById)

export default documentRouter;