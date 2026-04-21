import { AppDataSource } from "../../AppDataSource"
import { UserTimeAccount } from "../../entity/UserTimeAccount"
import { TimeEntry } from "../../entity/TimeEntry"
import { updateDeltaHours } from "../utils/updateDeltaHours"
import { isHoliday } from 'feiertagejs'
import { LessThanOrEqual, Between } from "typeorm"
import { RequestHandler } from "express"
import { TimeEntryType } from "../enums/timeRecording.enum"

export const dailyDeltaCron: RequestHandler = async (req, res, next) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)

    // Wochenende überspringen
    const dayOfWeek = today.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.status(200).json({ success: true, message: 'Wochenende, nichts zu tun.' })
    }

    // Feiertag überspringen
    if (isHoliday(today, 'NW')) {
      return res.status(200).json({ success: true, message: 'Feiertag, nichts zu tun.' })
    }

    // Alle aktiven Zeitkonten laden
    const timeAccounts = await AppDataSource.getRepository(UserTimeAccount).find({
      where: { valid_from: LessThanOrEqual(today) },
    })

    let processed = 0

    for (const account of timeAccounts) {
      const existingEntry = await AppDataSource.getRepository(TimeEntry).findOne({
        where: {
          time_account: { id: account.id },
          start_date: Between(today, todayEnd),
        }
      })

      if (!existingEntry) {

        if (existingEntry!.type === TimeEntryType.COMPENSATORY_OFF) {

          await updateDeltaHours(account, 0)
          processed++
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `${processed} Zeitkonten aktualisiert.`,
    })

  } catch (error) {
    next(error)
  }
}