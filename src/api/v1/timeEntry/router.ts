import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { listTimeEntriesByFilters } from './listTimeEntriesByFilters';
import { createTimeEntry } from './createTimeEntry';

const timeEntryRouter = Router();

timeEntryRouter.post('/my/filter', listTimeEntriesByFilters)
timeEntryRouter.post('/my/create', createTimeEntry)

export default timeEntryRouter;