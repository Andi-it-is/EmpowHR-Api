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
  working_location: Joi.string().valid(...Object.values(WorkingLocation)).optional().allow(null),   // null working location => abscence
  type: Joi.string().valid(...Object.values(TimeEntryType)).optional(),
  is_confirmed: Joi.boolean().optional(),
})

/**
 * @swagger
 * /timeEntry/my/{id}:
 *   patch:
 *     summary: Zeiteintrag aktualisieren
 *     description: |
 *       Aktualisiert einen bestehenden Zeiteintrag des eingeloggten Benutzers.
 *       Pausenzeiten und recorded_hours werden automatisch neu berechnet.
 *     tags:
 *       - TimeEntries
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID des Zeiteintrags
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
 *               type:
 *                 type: string
 *                 enum: [WORK, VACATION, SICK, SICK_CHILD, EDUCATION, PUBLIC_HOLIDAY, COMPENSATORY_OFF, SPECIAL_LEAVE, PARENTAL_LEAVE, UNPAID_LEAVE, ON_CALL]
 *     responses:
 *       200:
 *         description: Zeiteintrag erfolgreich aktualisiert
 *       400:
 *         description: Validierungsfehler oder Enddatum vor Startdatum
 *       403:
 *         description: Zeiteintrag gehört nicht dem eingeloggten Benutzer
 *       404:
 *         description: Zeiteintrag oder Zeitkonto nicht gefunden
 *       409:
 *         description: Für diesen Tag existiert bereits ein anderer Zeiteintrag
 *       422:
 *         description: Maximale Arbeitszeit überschritten
 *       500:
 *         description: Interner Serverfehler
 */
export const updateTimeEntry: UserRequestHandler = async (req, res, next) => {
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

    const total_hours = (end.getTime() - start.getTime()) / 1000 / 60 / 60
    if (total_hours > 10.75 && body.working_location !== null) {
      return res.status(422).json({
        success: false,
        message: 'Ein Arbeitstag darf maximal 10 Stunden und 45 Minuten umfassen (§3 ArbZG).',
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

    const timeEntry = await AppDataSource.getRepository(TimeEntry).findOne({
      where: { id, time_account: { id: timeAccount.id } },
    })

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Zeiteintrag nicht gefunden.',
      })
    }

    //* < Block to determine allowed Scope per route >
    const isScopeAllowed = await checkPermissionScope({
      requestingUserId: req.user.id,
      allowedScope: req.maxTargetPermissionScope,
      resolveTargetUserId: () => timeEntry.time_account.user.id,
      resolveTargetDepartmentId: () => timeEntry.time_account.user?.department?.id,
    })

    if (!isScopeAllowed) {
      return res.status(403).json({ success: false, message: "Keine Berechtigung für diese Aktion." })
    }
    //* < /Block to determine allowed Scope per route >

    // Prüfen ob ein anderer Eintrag am selben Tag existiert
    const startOfDay = new Date(start)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(start)
    endOfDay.setHours(23, 59, 59, 999)

    const conflictingEntry = await AppDataSource.getRepository(TimeEntry).findOne({
      where: {
        id: Not(id),
        time_account: { id: timeAccount.id },
        start_date: LessThan(end),
        end_date: MoreThan(start),
      }
    })

    if (conflictingEntry &&
      conflictingEntry.type !== TimeEntryType.PUBLIC_HOLIDAY &&
      body.type !== TimeEntryType.PUBLIC_HOLIDAY) {
      return res.status(409).json({
        success: false,
        message: 'Der Zeitraum überschneidet sich mit einem bestehenden Eintrag.',
      })
    }

    const type = body.type ?? timeEntry.type
    const { recorded_hours, interruption_hours } = calculateTimeEntryHours(type, start, end, timeAccount)

    await AppDataSource.getRepository(TimeEntry).update(
      { id },
      {
        start_date: start,
        end_date: end,
        working_location: body.working_location,
        type,
        recorded_hours,
        interruption_hours,
        ...(body.is_confirmed !== undefined && { is_confirmed: body.is_confirmed }),
      }
    )

    return res.status(200).json({
      success: true,
      data: {
        id,
        start_date: start,
        end_date: end,
        working_location: body.working_location,
        type,
        interruption_hours,
        recorded_hours,
        is_confirmed: timeEntry.is_confirmed,
      }
    })

  } catch (error) {
    next(error)
  }
}