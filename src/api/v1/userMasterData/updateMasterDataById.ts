import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";
import { UserMasterData } from "../../../entity/UserMasterData";
import Joi from "joi"
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope";

const paramsSchema = Joi.object({
  id: Joi.string().uuid().required(),
})

const bodySchema = Joi.object({
  // name
  firstname: Joi.string().min(1).max(100).optional(),
  lastname: Joi.string().min(1).max(100).optional(),
  date_of_birth: Joi.string().isoDate().optional(),

  // address
  street: Joi.string().min(2).max(90).optional(),
  zipcode: Joi.string().min(4).max(6).optional(),
  city: Joi.string().min(2).max(100).optional(),
  country: Joi.string().min(2).max(100).optional(),

  // contact
  telephone_business: Joi.string().min(6).max(20).optional(),
  telephone_private: Joi.string().min(6).max(20).allow('').optional(),
  company_alias: Joi.string().min(1).max(50).optional(),

  // other
  job_title: Joi.string().min(1).max(100).optional(),
  started_working_date: Joi.string().isoDate().optional(),
  banking_detail: Joi.string().min(24).max(30).optional(),
})

export const updateMasterDataById: UserRequestHandler = async (req, res, next) => {
  try {
    const params = await paramsSchema.validateAsync(req.params)
    const body = await bodySchema.validateAsync(req.body)

    const masterDataRepo = AppDataSource.getRepository(UserMasterData)

    const masterData = await masterDataRepo.findOne({
      where: { user: { id: params.id } },
      relations: ['user'],
    })

    if (!masterData) {
      return res.status(404).json({ success: false, message: 'Stammdaten nicht gefunden' })
    }

    //* < Block to determine allowed Scope per route >
    const isScopeAllowed = await checkPermissionScope({
      requestingUserId: req.user.id,
      allowedScope: req.maxTargetPermissionScope,
      resolveTargetUserId: () => params.id,
      resolveTargetDepartmentId: () => masterData.user?.department?.id,
    })

    if (!isScopeAllowed) {
      return res.status(403).json({ success: false, message: "Keine Berechtigung für diese Aktion." })
    }
    //* < /Block to determine allowed Scope per route >

    // Felder die auf dem User liegen separat behandeln
    const { firstname, lastname, ...masterDataFields } = body

    if (firstname || lastname) {
      const user = masterData.user
      if (firstname) user.firstname = firstname
      if (lastname) user.lastname = lastname
      await AppDataSource.manager.save(user)
    }


    Object.assign(masterData, masterDataFields)
    const saved = await AppDataSource.manager.save(masterData)

    return res.status(200).json({
      success: true,
      message: 'Stammdaten erfolgreich aktualisiert',
      data: saved,
    })

  } catch (error) {
    next(error)
  }
}