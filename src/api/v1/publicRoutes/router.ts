import { Router, Request, Response } from 'express';
// import { login } from './login';
import { getHelloWorld, postHelloWorld, patchHelloWorld, putHelloWorld, deleteHelloWorld } from './helloWorld';
import { createUser } from './testCreateUser';

const publicRouter = Router();

publicRouter.get('/hello', getHelloWorld)
publicRouter.post('/hello', postHelloWorld)
publicRouter.patch('/hello/:id', patchHelloWorld)

publicRouter.put('/hello', putHelloWorld)
publicRouter.delete('/hello/:id', deleteHelloWorld)

publicRouter.post('/testme', createUser)

export default publicRouter;