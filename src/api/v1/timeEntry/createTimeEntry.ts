import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { TimeEntry } from "../../../entity/TimeEntry"
import { UserTimeAccount } from "../../../entity/UserTimeAccount"
import { WorkingLocation, TimeEntryType } from "../../../lib/enums/timeRecording.enum"
import Joi from 'joi'
import { LessThan, MoreThan, Not } from "typeorm"
import { calculateTimeEntryHours } from "../../../lib/utils/timeCalculations"


const bodySchema = Joi.object({
  start_date: Joi.string().isoDate().required(),
  end_date: Joi.string().isoDate().required(),
  working_location: Joi.string().valid(...Object.values(WorkingLocation)).optional().allow(null),   // null working location => abscence
  type: Joi.string().valid(...Object.values(TimeEntryType)).optional().default(TimeEntryType.WORK),
})

/**
 * @swagger
 * /timeEntry/my/create:
 *   post:
 *     summary: Zeiteintrag erstellen
 *     description: |
 *       Erstellt einen neuen Zeiteintrag für den eingeloggten Benutzer.
 *       Pausenzeiten werden automatisch nach §4 ArbZG berechnet:
 *       - Ab 6h Arbeitszeit: 30 Minuten Pflichtpause
 *       - Ab 9h Arbeitszeit: 45 Minuten Pflichtpause
 *       - Maximal 10h 45min Gesamtarbeitszeit (§3 ArbZG)
 *       - Pro Tag ist nur ein Zeiteintrag erlaubt
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
 *                 description: Startzeitpunkt des Eintrags als ISO 8601 Datum mit Uhrzeit
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-04-19T17:00:00.000Z"
 *                 description: Endzeitpunkt des Eintrags als ISO 8601 Datum mit Uhrzeit
 *               working_location:
 *                 type: string
 *                 enum: [OFFICE, REMOTE, FIELD_SERVICE]
 *                 example: "OFFICE"
 *                 description: Arbeitsort des Eintrags
 *               type:
 *                 type: string
 *                 enum: [WORK, VACATION, SICK, SICK_CHILD, EDUCATION, PUBLIC_HOLIDAY, COMPENSATORY_OFF, SPECIAL_LEAVE, PARENTAL_LEAVE, UNPAID_LEAVE, ON_CALL]
 *                 default: WORK
 *                 description: |
 *                   Art des Zeiteintrags. Bei Abwesenheiten (nicht WORK) werden
 *                   recorded_hours automatisch aus dem Vertrag berechnet (contract_hours_per_week / working_days_per_week)
 *     responses:
 *       201:
 *         description: Zeiteintrag erfolgreich erstellt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     start_date:
 *                       type: string
 *                       format: date-time
 *                     end_date:
 *                       type: string
 *                       format: date-time
 *                     working_location:
 *                       type: string
 *                       enum: [OFFICE, REMOTE, FIELD_SERVICE]
 *                     type:
 *                       type: string
 *                       enum: [WORK, VACATION, SICK, SICK_CHILD, EDUCATION, PUBLIC_HOLIDAY, COMPENSATORY_OFF, SPECIAL_LEAVE, PARENTAL_LEAVE, UNPAID_LEAVE, ON_CALL]
 *                     interruption_hours:
 *                       type: number
 *                       description: Automatisch berechnete Pausenzeit nach §4 ArbZG
 *                       example: 0.5
 *                     recorded_hours:
 *                       type: number
 *                       description: Tatsächlich anrechenbare Arbeitsstunden nach Abzug der Pausen
 *                       example: 7.5
 *                     is_confirmed:
 *                       type: boolean
 *                       description: Arbeitseinträge (WORK) sind automatisch bestätigt
 *                       example: true
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validierungsfehler oder Enddatum vor Startdatum
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Das Enddatum muss nach dem Startdatum liegen."
 *       404:
 *         description: Kein Zeitkonto für den Benutzer gefunden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Kein Zeitkonto für diesen Benutzer gefunden."
 *       409:
 *         description: Für diesen Tag existiert bereits ein Zeiteintrag
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Für diesen Tag existiert bereits ein Zeiteintrag."
 *       422:
 *         description: Maximale Arbeitszeit überschritten
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Ein Arbeitstag darf maximal 10 Stunden und 45 Minuten umfassen (§3 ArbZG)."
 *       500:
 *         description: Interner Serverfehler
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

    const toLocalTime = (date: Date) =>
      date.toLocaleTimeString('de-DE', {
        timeZone: 'Europe/Berlin',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })

    const isFullDay = toLocalTime(start) === '00:00' && toLocalTime(end) === '23:59'

    // Fortbidlung und Sonderurlaub sind die einzigen 2 Arten, Ganztägige Abwesenheiten nicht verpflichten
    const FULL_DAY_ONLY_TYPES = [
      TimeEntryType.VACATION,
      TimeEntryType.SICK,
      TimeEntryType.SICK_CHILD,
      TimeEntryType.PUBLIC_HOLIDAY,
      TimeEntryType.PARENTAL_LEAVE,
      TimeEntryType.UNPAID_LEAVE,
    ]

    if (FULL_DAY_ONLY_TYPES.includes(body.type) && !isFullDay) {
      return res.status(400).json({
        success: false,
        message: `Dieser Abwesenheitstyp kann nur ganztägig gebucht werden.`,
      })
    }

    if (body.type === TimeEntryType.VACATION) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (start < today) {
        return res.status(400).json({
          success: false,
          message: 'Urlaubseinträge können nicht in der Vergangenheit erstellt werden.',
        })
      }
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

    const conflictingEntry = await AppDataSource.getRepository(TimeEntry).findOne({
      where: {
        time_account: { id: timeAccount.id },
        start_date: LessThan(end),
        end_date: MoreThan(start),
        type: Not(TimeEntryType.PUBLIC_HOLIDAY)
      }
    })

    if (conflictingEntry) {
      return res.status(409).json({
        success: false,
        message: 'Der Zeitraum überschneidet sich mit einem bestehenden Eintrag.',
      })
    }

    const { recorded_hours, interruption_hours } = calculateTimeEntryHours(body.type, start, end, timeAccount)

    // Working hours do not need approval by default
    let confirmStatus = false
    if (body.working_location && body.type === TimeEntryType.WORK) {
      confirmStatus = true
    }
    // being sick does not need approval by default
    if(body.type === TimeEntryType.SICK || body.type === TimeEntryType.SICK_CHILD || body.type === TimeEntryType.PUBLIC_HOLIDAY) {
      confirmStatus = true
    }

    const total_hours = (end.getTime() - start.getTime()) / 1000 / 60 / 60

    if (total_hours > 10.75 && body.type === TimeEntryType.WORK) {
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