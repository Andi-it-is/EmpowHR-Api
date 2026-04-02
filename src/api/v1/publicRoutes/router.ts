import { Router, Request, Response } from 'express';
// import { login } from './login';
import { getHelloWorld, postHelloWorld, patchHelloWorld, putHelloWorld, deleteHelloWorld } from './helloWorld';

const publicRouter = Router();

publicRouter.get('/hello', getHelloWorld)
publicRouter.post('/hello', postHelloWorld)
publicRouter.patch('/hello/:id', patchHelloWorld)

publicRouter.put('/hello', putHelloWorld)
publicRouter.delete('/hello/:id', deleteHelloWorld)

export default publicRouter;