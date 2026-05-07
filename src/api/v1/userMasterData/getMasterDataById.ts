import { User } from "../../../entity/User";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";
import { UserMasterData } from "../../../entity/UserMasterData";
import Joi from "joi";
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope";

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

    //* < Block to determine allowed Scope per route >
    const isScopeAllowed = await checkPermissionScope({
      requestingUserId: req.user.id,
      allowedScope: req.maxTargetPermissionScope,
      resolveTargetUserId: () => params.id,
      resolveTargetDepartmentId: () => masterData?.user?.department?.id,
    })

    if (!isScopeAllowed) {
      return res.status(403).json({ success: false, message: "Keine Berechtigung für diese Aktion." })
    }
    //* < /Block to determine allowed Scope per route >

    return res.status(200).json({
      success: true,
      data: masterData
    })

  } catch (error) {
    next(error)
  }
}