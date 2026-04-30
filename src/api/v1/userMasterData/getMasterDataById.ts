import { User } from "../../../entity/User";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";
import { UserMasterData } from "../../../entity/UserMasterData";
import Joi from "joi";

const paramsSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

export const getMasterDataById: UserRequestHandler = async (req, res, next) => {
  try {

    const params = await paramsSchema.validateAsync(req.params)
    const masterData = await AppDataSource.getRepository(UserMasterData)
      .findOne({
        where: {
          user: {
            id: params.id
          },
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