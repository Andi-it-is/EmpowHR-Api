import { Router } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { listAllDepartments } from './listAllDepartments';
import { createDepartment } from './createDepartment';
import { updateDepartmentById } from './updateDepartmentById';
import { deleteDepartmentById } from './deleteDepartmentById';
import { ExistingEntityNames, PermissionAction } from '../../../lib/enums/acessControl.enum';
import { listDepartmentCalendarWithUsers } from './listDepartmentCalendarWithUsers';
import { listDepartmentCalendarAnonymized } from './listDepartmentCalendarAnonymized';

const departmentRouter = Router();

departmentRouter.get('/all',
  permissionChecker(ExistingEntityNames.DEPARTMENT, PermissionAction.READ),
  listAllDepartments
)

departmentRouter.post('/list/teamcalendar/:id',
  permissionChecker(ExistingEntityNames.DEPARTMENT, PermissionAction.READ),
  listDepartmentCalendarWithUsers
)
departmentRouter.post('/list/teamcalendar/:id/anonymized',
  permissionChecker(ExistingEntityNames.DEPARTMENT, PermissionAction.READ),
  listDepartmentCalendarAnonymized
)

departmentRouter.post('/create', permissionChecker(ExistingEntityNames.DEPARTMENT, PermissionAction.CREATE), createDepartment)

departmentRouter.patch('/:id', permissionChecker(ExistingEntityNames.DEPARTMENT, PermissionAction.UPDATE), updateDepartmentById)
departmentRouter.delete('/:id', permissionChecker(ExistingEntityNames.DEPARTMENT, PermissionAction.DELETE), deleteDepartmentById)

export default departmentRouter;

