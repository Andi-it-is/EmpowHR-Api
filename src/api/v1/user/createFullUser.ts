import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import Joi from 'joi'
import { AppDataSource } from "../../../AppDataSource";
import { User } from "../../../entity/User";
import { Department } from "../../../entity/Department";
import { UserMasterData } from "../../../entity/UserMasterData";
import { UserTimeAccount } from "../../../entity/UserTimeAccount";

enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NONE = '-'
}

const bodySchema = Joi.object({
  // Step 1 – Basis Daten
  firstname: Joi.string().min(1).required(),
  lastname: Joi.string().min(1).required(),
  email: Joi.string().email().required(),
  departmentId: Joi.string().uuid().required(),
  location: Joi.string().min(1).required(),
  entryDate: Joi.string().isoDate().required(),
  job_title: Joi.string().min(1).required(),

  // Step 2 – Stammdaten
  birthDate: Joi.string().isoDate().required(),
  birthPlace: Joi.string().min(1).required(),
  nationality: Joi.string().min(1).required(),
  gender: Joi.string().valid(...Object.values(Gender)).required(),
  banking_detail: Joi.string().min(1).required(),
  street: Joi.string().min(1).required(),
  zipcode: Joi.string().min(1).required(),
  city: Joi.string().min(1).required(),
  country: Joi.string().min(1).required(),
  company_alias: Joi.string().min(1).required(),
  telephone_business: Joi.string().min(1).required(),
  telephone_private: Joi.string().allow('').optional(),

  // Step 3 – Zeitkonto
  contract_hours_per_week: Joi.number().positive().required(),
  working_days_per_week: Joi.number().min(1).max(7).required(),
  vacation_days_per_year: Joi.number().positive().required(),
  delta_hours: Joi.number().required(),
})

export const createFullUser: UserRequestHandler = async (req, res, next) => {
  try {
    const body = await bodySchema.validateAsync(req.body, { abortEarly: false })

    const userRepo = AppDataSource.getRepository(User)
    const departmentRepo = AppDataSource.getRepository(Department)

    const department = await departmentRepo.findOne({ where: { id: body.departmentId } })
    if (!department) {
      return res.status(404).json({ message: 'Abteilung nicht gefunden' })
    }

    const existingUser = await userRepo.findOne({ where: { email: body.email } })
    if (existingUser) {
      return res.status(409).json({ message: 'E-Mail wird bereits verwendet' })
    }

    const masterData = new UserMasterData()
    masterData.company_alias = body.company_alias
    masterData.street = body.street
    masterData.zipcode = body.zipcode
    masterData.city = body.city
    masterData.country = body.country
    masterData.date_of_birth = body.birthDate.slice(0, 10)
    masterData.telephone_business = body.telephone_business
    masterData.telephone_private = body.telephone_private ?? null
    masterData.banking_detail = body.banking_detail
    masterData.job_title = body.job_title
    masterData.started_working_date = body.entryDate.slice(0, 10)

    const timeAccount = new UserTimeAccount()
    timeAccount.contract_hours_per_week = body.contract_hours_per_week
    timeAccount.working_days_per_week = body.working_days_per_week
    timeAccount.vacation_days_per_year = body.vacation_days_per_year
    timeAccount.delta_hours = body.delta_hours
    timeAccount.valid_from = new Date(body.entryDate)

    const user = new User()
    user.firstname = body.firstname
    user.lastname = body.lastname
    user.email = body.email
    user.gender = body.gender as Gender
    user.department = department
    user.master_data = masterData
    user.time_account = timeAccount

    // Temporäres Passwort – sollte per Mail verschickt oder separat gesetzt werden
    user.password_hash = 'CHANGEME'

    await userRepo.save(user)

    return res.status(201).json({ message: 'Mitarbeitender erfolgreich angelegt', id: user.id })

  } catch (error) {
    next(error)
  }
}