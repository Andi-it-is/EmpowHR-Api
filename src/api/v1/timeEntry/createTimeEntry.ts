import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { TimeEntry } from "../../../entity/TimeEntry"
import { UserTimeAccount } from "../../../entity/UserTimeAccount"
import { WorkingLocation, TimeEntryType } from "../../../lib/enums/timeRecording.enum"
import Joi from 'joi'
import { Between } from "typeorm"

const bodySchema = Joi.object({
  start_date: Joi.string().isoDate().required(),
  end_date: Joi.string().isoDate().required(),
  working_location: Joi.string().valid(...Object.values(WorkingLocation)).required(),
  type: Joi.string().valid(...Object.values(TimeEntryType)).optional().default(TimeEntryType.WORK),
})

/**
 * @swagger
 * /timeEntry/my/create:
 *   post:
 *     summary: Zeiteintrag erstellen
 *     description: Erstellt einen neuen Zeiteintrag für den eingeloggten Benutzer.
 *     tags:
 *       - TimeEntries
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - start_date
 *               - end_date
 *               - working_location
 *             properties:
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-04-19T09:00:00.000Z"
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-04-19T17:00:00.000Z"
 *               working_location:
 *                 type: string
 *                 enum: [OFFICE, REMOTE, FIELD_SERVICE]
 *                 example: "OFFICE"
 *               type:
 *                 type: string
 *                 enum: [WORK, VACATION, SICK, SICK_CHILD, EDUCATION, PUBLIC_HOLIDAY, COMPENSATORY_OFF, SPECIAL_LEAVE, PARENTAL_LEAVE, UNPAID_LEAVE, ON_CALL]
 *                 default: WORK
 *               interruption_hours:
 *                 type: number
 *                 default: 0
 *                 example: 0.5
 *     responses:
 *       201:
 *         description: Zeiteintrag erfolgreich erstellt
 *       400:
 *         description: Validierungsfehler
 *       404:
 *         description: Kein Zeitkonto gefunden
 *       500:
 *         description: Serverfehler
 */
export const createTimeEntry: UserRequestHandler = async (req, res, next) => {
  try {
    const body = await bodySchema.validateAsync(req.body)

    const start = new Date(body.start_date)
    const end = new Date(body.end_date)

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'Das Enddatum muss nach dem Startdatum liegen.',
      })
    }

    const timeAccount = await AppDataSource.getRepository(UserTimeAccount).findOne({
      where: { user: { id: req.user.id } },
    })

    if (!timeAccount) {
      return res.status(404).json({
        success: false,
        message: 'Kein Zeitkonto für diesen Benutzer gefunden.',
      })
    }

    //- Überprüfen, ob für den Tag bereits ein Eintrag existiert
    const startOfDay = new Date(start)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(start)
    endOfDay.setHours(23, 59, 59, 999)

    const existingEntry = await AppDataSource.getRepository(TimeEntry).findOne({
      where: {
        time_account: { id: timeAccount.id },
        start_date: Between(startOfDay, endOfDay),
      }
    })

    if (existingEntry) {
      return res.status(409).json({
        success: false,
        message: 'Für diesen Tag existiert bereits ein Zeiteintrag.',
      })
    }

    //- Deutsche Arbeitszeiten Berechnungen
    const calculateWorkHours = (
      start: Date,
      end: Date,
    ): { recorded_hours: number; interruption_hours: number } => {
      const total_hours = (end.getTime() - start.getTime()) / 1000 / 60 / 60

      let interruption_hours = 0
      let recorded_hours = total_hours

      if (total_hours > 6 && total_hours <= 6.5) {
        // Über 6h aber weniger als 6.5h → Überschuss wird Pause
        interruption_hours = total_hours - 6
        recorded_hours = 6
      } else if (total_hours > 6.5 && total_hours <= 9) {
        // Pflichtpause 30min greift
        interruption_hours = 0.5
        recorded_hours = total_hours - 0.5
      } else if (total_hours > 9 && total_hours <= 9.5) {
        // Über 9h aber weniger als 9.5h → Überschuss wird zusätzliche Pause
        interruption_hours = 0.5 + (total_hours - 9)
        recorded_hours = 9
      } else if (total_hours > 9.5 && total_hours <= 10) {
        // Pflichtpause 45min greift
        interruption_hours = 0.75
        recorded_hours = total_hours - 0.75
      } else if (total_hours > 10) {
        // Maximum: 10h recorded, 45min Pause
        interruption_hours = 0.75
        recorded_hours = Math.min(total_hours - 0.75, 10)
      }

      return {
        recorded_hours: Math.round(recorded_hours * 100) / 100,
        interruption_hours: Math.round(interruption_hours * 100) / 100,
      }
    }

    const calculateAbsenceHours = (
      timeAccount: UserTimeAccount,
    ): { recorded_hours: number; interruption_hours: number } => {
      const recorded_hours = timeAccount.contract_hours_per_week / timeAccount.working_days_per_week
      return {
        recorded_hours: Math.round(recorded_hours * 100) / 100,
        interruption_hours: 0,
      }
    }

    const isWork = body.type === TimeEntryType.WORK
    const { recorded_hours, interruption_hours } = isWork
      ? calculateWorkHours(start, end)
      : calculateAbsenceHours(timeAccount)

    // Working hours do not need approval by default
    let confirmStatus = false
    if (body.working_location && body.type === TimeEntryType.WORK) {
      confirmStatus = true
    }

    const total_hours = (end.getTime() - start.getTime()) / 1000 / 60 / 60

    if (total_hours > 10.75) {
      return res.status(422).json({
        success: false,
        message: 'Ein Arbeitstag darf maximal 10 Stunden und 45 Minuten umfassen (§3 ArbZG).',
      })
    }

    const timeEntry = AppDataSource.getRepository(TimeEntry).create({
      start_date: start,
      end_date: end,
      working_location: body.working_location,
      type: body.type,
      interruption_hours: interruption_hours,
      recorded_hours: recorded_hours,
      is_confirmed: confirmStatus,
      time_account: timeAccount,
    })

    await AppDataSource.getRepository(TimeEntry).save(timeEntry)

    const sollPerDay = timeAccount.contract_hours_per_week / timeAccount.working_days_per_week
    const delta = recorded_hours - sollPerDay

    await AppDataSource.getRepository(UserTimeAccount).update(
      { id: timeAccount.id },
      { delta_hours: timeAccount.delta_hours + delta }
    )

    return res.status(201).json({
      success: true,
      data: {
        id: timeEntry.id,
        start_date: timeEntry.start_date,
        end_date: timeEntry.end_date,
        working_location: timeEntry.working_location,
        type: timeEntry.type,
        interruption_hours: timeEntry.interruption_hours,
        recorded_hours: timeEntry.recorded_hours,
        is_confirmed: timeEntry.is_confirmed,
        created_at: timeEntry.created_at,
      }
    })

  } catch (error) {
    next(error)
  }
}