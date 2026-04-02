import { User } from "../../../entity/User";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";

export const getAllUsers: UserRequestHandler = async (req, res, next) => {
  
  try {
    console.log("admiiiiiiiin")
  } catch (error) {
    next(error)
  }
}