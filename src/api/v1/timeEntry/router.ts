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
import { ExistingEntityNames, PermissionAction } from '../../../lib/enums/acessControl.enum';

const timeEntryRouter = Router();

timeEntryRouter.post('/my/filter', permissionChecker(ExistingEntityNames.TIME_ENTRY, PermissionAction.READ), listTimeEntriesByFilters)
timeEntryRouter.post('/my/create', permissionChecker(ExistingEntityNames.TIME_ENTRY, PermissionAction.CREATE), createTimeEntry)
timeEntryRouter.post('/other/:id/create', permissionChecker(ExistingEntityNames.TIME_ENTRY, PermissionAction.CREATE), createTimeEntryForUserByUserId)
timeEntryRouter.post('/other/:id/filter', permissionChecker(ExistingEntityNames.TIME_ENTRY, PermissionAction.READ), listAbscenceTimeEntiresByUserId)

timeEntryRouter.patch('/my/:id', permissionChecker(ExistingEntityNames.TIME_ENTRY, PermissionAction.UPDATE), updateTimeEntry)
timeEntryRouter.patch('/other/:userId/:entryId', permissionChecker(ExistingEntityNames.TIME_ENTRY, PermissionAction.UPDATE), updateTimeEntryByUserId)

timeEntryRouter.delete('/my/:id', permissionChecker(ExistingEntityNames.TIME_ENTRY, PermissionAction.DELETE), deleteTimeEntry)
timeEntryRouter.delete('/other/:userId/:entryId', permissionChecker(ExistingEntityNames.TIME_ENTRY, PermissionAction.DELETE), deleteTimeEntryByUserId)

//- Route for internal use, when executing the cronjob
timeEntryRouter.post('/internal/cron/dailyDelta', cronAuthMiddleware, dailyDeltaCron)



export default timeEntryRouter;