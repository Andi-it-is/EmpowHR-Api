import { User } from "../../../entity/User";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";

export const getSimpleUserInfo: UserRequestHandler = async (req, res, next) => {
  try {

    const id = req.user.id  // ← kommt aus dem JWT via userTokenChecker

    const user = await AppDataSource.getRepository(User)
      .findOne({
        where: { id },
        select: {
          firstname: true,
          lastname: true,
          email: true,
        }
      })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User nicht gefunden."
      })
    }

    return res.status(200).json({
      success: true,
      data: user
    })

  } catch (error) {
    next(error)
  }
}