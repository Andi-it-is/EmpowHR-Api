import { Router, Request, Response } from 'express';
import { permissionChecker } from '../../../lib/middleware/permissionChecker';
import { listAllDepartments } from './listtAllDepartments';
import { createDepartment } from './createDepartment';
import { updateDepartmentById } from './updateDepartmentById';
import { deleteDepartmentById } from './deleteDepartmentById';

const departmentRouter = Router();

departmentRouter.get('/all', listAllDepartments)
departmentRouter.post('/create', createDepartment)

departmentRouter.patch('/:id', updateDepartmentById)
departmentRouter.delete('/:id', deleteDepartmentById)

export default departmentRouter;