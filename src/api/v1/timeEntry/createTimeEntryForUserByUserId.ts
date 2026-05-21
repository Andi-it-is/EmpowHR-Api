import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { TimeEntry } from "../../../entity/TimeEntry"
import { UserTimeAccount } from "../../../entity/UserTimeAccount"
import { WorkingLocation, TimeEntryType } from "../../../lib/enums/timeRecording.enum"
import Joi from 'joi'
import { LessThan, MoreThan, Not } from "typeorm"
import { calculateTimeEntryHours } from "../../../lib/utils/timeCalculations"
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope"

const paramSchema = Joi.object({
  id: Joi.string().uuid().required(),
})

const bodySchema = Joi.object({
  start_date: Joi.string().isoDate().required(),
  end_date: Joi.string().isoDate().required(),
  working_location: Joi.string().valid(...Object.values(WorkingLocation)).optional().allow(null),
  type: Joi.string().valid(...Object.values(TimeEntryType)).optional().default(TimeEntryType.WORK),
})

/**
 * @swagger
 * /timeEntry/other/{id}/create:
 *   post:
 *     summary: Zeiteintrag für einen anderen Benutzer erstellen
 *     description: |
 *       Erstellt einen neuen Zeiteintrag für einen bestimmten Benutzer. Nur für HR-Berechtigte.
 *       Pausenzeiten werden automatisch nach §4 ArbZG berechnet.
 *     tags:
 *       - TimeEntries
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID des Benutzers für den der Eintrag erstellt werden soll
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - start_date
 *               - end_date
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
 *               type:
 *                 type: string
 *                 enum: [WORK, VACATION, SICK, SICK_CHILD, EDUCATION, PUBLIC_HOLIDAY, COMPENSATORY_OFF, SPECIAL_LEAVE, PARENTAL_LEAVE, UNPAID_LEAVE, ON_CALL]
 *                 default: WORK
 *     responses:
 *       201:
 *         description: Zeiteintrag erfolgreich erstellt
 *       400:
 *         description: Validierungsfehler oder Enddatum vor Startdatum
 *       404:
 *         description: Kein Zeitkonto für den angegebenen Benutzer gefunden
 *       409:
 *         description: Zeitraum überschneidet sich mit einem bestehenden Eintrag
 *       422:
 *         description: Maximale Arbeitszeit überschritten
 *       500:
 *         description: Interner Serverfehler
 */
export const createTimeEntryForUserByUserId: UserRequestHandler = async (req, res, next) => {
  try {
    const { id } = await paramSchema.validateAsync(req.params)
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
        message: 'Dieser Abwesenheitstyp kann nur ganztägig gebucht werden.',
      })
    }

    const total_hours = (end.getTime() - start.getTime()) / 1000 / 60 / 60
    if (total_hours > 10.75 && body.type === TimeEntryType.WORK) {
      return res.status(422).json({
        success: false,
        message: 'Ein Arbeitstag darf maximal 10 Stunden und 45 Minuten umfassen (§3 ArbZG).',
      })
    }

    const timeAccount = await AppDataSource.getRepository(UserTimeAccount).findOne({
      where: { user: { id } },
    })

    if (!timeAccount) {
      return res.status(404).json({
        success: false,
        message: 'Kein Zeitkonto für diesen Benutzer gefunden.',
      })
    }

    const conflictingEntry = await AppDataSource.getRepository(TimeEntry).findOne({
      where: {
        time_account: { id: timeAccount.id },
        start_date: LessThan(end),
        end_date: MoreThan(start),
        type: Not(TimeEntryType.PUBLIC_HOLIDAY),
      },
    })

    if (conflictingEntry) {
      return res.status(409).json({
        success: false,
        message: 'Der Zeitraum überschneidet sich mit einem bestehenden Eintrag.',
      })
    }

    const { recorded_hours, interruption_hours } = calculateTimeEntryHours(body.type, start, end, timeAccount)

    // HR erstellt Einträge direkt als bestätigt
    let confirmStatus = false
    if (body.working_location && body.type === TimeEntryType.WORK) {
      confirmStatus = true
    }
    if (body.type === TimeEntryType.SICK || body.type === TimeEntryType.SICK_CHILD || body.type === TimeEntryType.PUBLIC_HOLIDAY) {
      confirmStatus = true
    }

    //* < Block to determine allowed Scope per route >
    const isScopeAllowed = await checkPermissionScope({
      requestingUserId: req.user.id,
      allowedScope: req.maxTargetPermissionScope,
      resolveTargetUserId: () => timeAccount.user.id,
      resolveTargetDepartmentId: () => timeAccount.user.department.id,
    })

    if (!isScopeAllowed) {
      return res.status(403).json({ success: false, message: "Keine Berechtigung für diese Aktion." })
    }
    //* < /Block to determine allowed Scope per route >

    const timeEntry = AppDataSource.getRepository(TimeEntry).create({
      start_date: start,
      end_date: end,
      working_location: body.working_location,
      type: body.type,
      interruption_hours,
      recorded_hours,
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
      },
    })

  } catch (error) {
    next(error)
  }
}