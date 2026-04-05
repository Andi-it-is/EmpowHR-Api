import { User } from "../../../entity/User";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";

export const getUserInfo: UserRequestHandler = async (req, res, next) => {

  try {
    console.log("ich will user infos bekommen")
  } catch (error) {
    next(error)
  }
}