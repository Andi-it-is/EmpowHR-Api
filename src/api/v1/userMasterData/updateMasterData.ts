import { User } from "../../../entity/User";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";
import { UserMasterData } from "../../../entity/UserMasterData";
import Joi from "joi"

export const bodySchema = Joi.object({
  street: Joi.string().min(2).max(90).optional(),
  zipcode: Joi.string().min(4).max(6).optional(),
  city: Joi.string().min(2).max(100).optional(),
  country: Joi.string().min(2).max(100).optional(),
  banking_detail: Joi.string().min(24).max(30).optional(),
})

export const updateMasterData: UserRequestHandler = async (req, res, next) => {
  try {

    const id = req.user.id

    const body = await bodySchema.validateAsync(req.body)

    const masterData = await AppDataSource.getRepository(UserMasterData)
      .findOne({
        where: {
          user: { id },
        },
        relations: ["user"]
      })

    if (masterData) {
      Object.assign(masterData, body);
    }

    const savedMasterData = await AppDataSource.manager.save(masterData)

    return res.status(200).json({
      success: true,
      message: "Stammdaten erfolgreich aktualisiert",
      data: savedMasterData
    });

  } catch (error) {
    next(error)
  }
}