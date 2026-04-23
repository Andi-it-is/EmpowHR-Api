import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { UserTimeAccount } from "../../../entity/UserTimeAccount"

export const getMyTimeAccount: UserRequestHandler = async (req, res, next) => {
  try {
    const timeAccount = await AppDataSource.getRepository(UserTimeAccount).findOne({
      where: { user: { id: req.user.id } },
    })

    if (!timeAccount) {
      return res.status(404).json({
        success: false,
        message: 'Kein Zeitkonto für diesen Benutzer gefunden.',
      })
    }
    const shouldWorkHoursPerWeek = timeAccount.contract_hours_per_week / timeAccount.working_days_per_week

    return res.status(200).json({
      success: true,
      data: timeAccount,
      shouldWorkHoursPerWeek: shouldWorkHoursPerWeek
    })

  } catch (error) {
    next(error)
  }
}