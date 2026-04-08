import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { getDocuments } from './getDocuments';
import { getDocumentFile } from './getDocumentFile';
import { getDocumentsByFilter } from './getDocumentsByFilters';

const documentRouter = Router();

documentRouter.get('/my', getDocuments)
documentRouter.post('/my/filter', getDocumentsByFilter)

documentRouter.get('/:id/file', getDocumentFile)

export default documentRouter;