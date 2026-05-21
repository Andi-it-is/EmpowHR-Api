import { AppDataSource } from "../../AppDataSource"
import { UserTimeAccount } from "../../entity/UserTimeAccount"

export const updateDeltaHours = async (
  timeAccount: UserTimeAccount,
  recorded_hours: number
): Promise<void> => {
  const sollPerDay = timeAccount.contract_hours_per_week / timeAccount.working_days_per_week
  const delta = recorded_hours - sollPerDay

  await AppDataSource.getRepository(UserTimeAccount).update(
    { id: timeAccount.id },
    { delta_hours: timeAccount.delta_hours + delta }
  )
}