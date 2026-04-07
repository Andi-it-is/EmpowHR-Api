import { User } from "../../../entity/User";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";
import { UserMasterData } from "../../../entity/UserMasterData";

export const getMasterData: UserRequestHandler = async (req, res, next) => {
  try {

    const id = req.user.id

    const masterData = await AppDataSource.getRepository(UserMasterData)
      .findOne({
        where: {
          user: { id },
        },
        relations: ["user"]
      })

    return res.status(200).json({
      success: true,
      data: masterData
    })

  } catch (error) {
    next(error)
  }
}