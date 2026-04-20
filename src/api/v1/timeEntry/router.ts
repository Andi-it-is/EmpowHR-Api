import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { listTimeEntriesByFilters } from './listTimeEntriesByFilters';
import { createTimeEntry } from './createTimeEntry';
import { dailyDeltaCron } from '../../../lib/cron/cronCalculateTimeDeltas';
import { cronAuthMiddleware } from '../../../lib/middleware/cronAuthMiddleware';
import { updateTimeEntry } from './updateTimeEntry';
import { deleteTimeEntry } from './deleteTimeEntry';

const timeEntryRouter = Router();

timeEntryRouter.post('/my/filter', listTimeEntriesByFilters)
timeEntryRouter.post('/my/create', createTimeEntry)
timeEntryRouter.patch('/my/:id', updateTimeEntry)
timeEntryRouter.delete('/my/:id', deleteTimeEntry)


//- Route for internal use, when executing the cronjob
timeEntryRouter.post('/internal/cron/dailyDelta', cronAuthMiddleware, dailyDeltaCron)



export default timeEntryRouter;