import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { listTimeEntriesByFilters } from './listTimeEntriesByFilters';
import { createTimeEntry } from './createTimeEntry';
import { dailyDeltaCron } from '../../../lib/cron/cronCalculateTimeDeltas';
import { cronAuthMiddleware } from '../../../lib/middleware/cronAuthMiddleware';
import { updateTimeEntry } from './updateTimeEntry';
import { deleteTimeEntry } from './deleteTimeEntry';
import { listAbscenceTimeEntiresByUserId } from './listAbscenceTimeEntiresByUserId';
import { createTimeEntryForUserByUserId } from './createTimeEntryForUserByUserId';
import { updateTimeEntryByUserId } from './updateTimeEntryByUserId';
import { deleteTimeEntryByUserId } from './deleteTimeEntryByUserId';

const timeEntryRouter = Router();

timeEntryRouter.post('/my/filter', listTimeEntriesByFilters)
timeEntryRouter.post('/my/create', createTimeEntry)
timeEntryRouter.post('/other/:id/filter', listAbscenceTimeEntiresByUserId)
timeEntryRouter.post('/other/:id/create', createTimeEntryForUserByUserId)

timeEntryRouter.patch('/my/:id', updateTimeEntry)
timeEntryRouter.patch('/other/:userId/:entryId', updateTimeEntryByUserId)

timeEntryRouter.delete('/my/:id', deleteTimeEntry)
timeEntryRouter.delete('/other/:userId/:entryId', deleteTimeEntryByUserId)

//- Route for internal use, when executing the cronjob
timeEntryRouter.post('/internal/cron/dailyDelta', cronAuthMiddleware, dailyDeltaCron)



export default timeEntryRouter;