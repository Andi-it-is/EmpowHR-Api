import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { listAllDepartments } from './listtAllDepartments';
import { createDepartment } from './createDepartment';
import { updateDepartmentById } from './updateDepartmentById';
import { deleteDepartmentById } from './deleteDepartmentById';
import { ExistingEntityNames, PermissionAction } from '../../../lib/enums/acessControl.enum';

const departmentRouter = Router();

departmentRouter.get('/all', listAllDepartments)
departmentRouter.post('/create', permissionChecker(ExistingEntityNames.DEPARTMENT, PermissionAction.CREATE), createDepartment)

departmentRouter.patch('/:id', updateDepartmentById)
departmentRouter.delete('/:id', deleteDepartmentById)

export default departmentRouter;