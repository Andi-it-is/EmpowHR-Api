import { requestContext } from './dbRequestContext'
import { UserRequest } from '../classes/UserRequestHandler'

export const contextMiddleware = (req: any, res: any, next: any) => {
  const userReq = req as UserRequest
  requestContext.run({ currentUser: userReq.user }, () => next())
}