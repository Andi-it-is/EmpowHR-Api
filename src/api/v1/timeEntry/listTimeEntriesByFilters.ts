import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { TimeEntry } from "../../../entity/TimeEntry"
import { WorkingLocation, TimeEntryType } from "../../../lib/enums/timeRecording.enum"
import { Between, In, MoreThanOrEqual, LessThanOrEqual, FindOptionsWhere, IsNull } from "typeorm"
import Joi from 'joi'
import { UserTimeAccount } from "../../../entity/UserTimeAccount"

const bodySchema = Joi.object({
  working_location: Joi.array().items(
    Joi.string().valid(...Object.values(WorkingLocation), null).allow(null)
  ).optional(),
  type: Joi.array().items(Joi.string().valid(...Object.values(TimeEntryType))).optional(),
  start_date: Joi.string().isoDate().optional(),
  end_date: Joi.string().isoDate().optional(),
  is_confirmed: Joi.boolean().optional(),
})

const toEndOfDay = (dateStr: string): Date => {
  const d = new Date(dateStr)
  d.setHours(23, 59, 59, 999)
  return d
}

/**
 * @swagger
 * /time-entry/my/filter:
 *   post:
 *     summary: Zeiteinträge gefiltert abrufen
 *     description: Gibt Zeiteinträge des eingeloggten Benutzers gefiltert nach Arbeitsort, Typ, Zeitraum und Bestätigungsstatus zurück.
 *     tags:
 *       - TimeEntries
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               working_location:
 *                 type: array
 *                 items:
 *                   type: string
 *                   nullable: true
 *                   enum: [OFFICE, REMOTE, FIELD_SERVICE, null]
 *                 description: "null = Abwesenheit"
 *                 example: ["OFFICE", "REMOTE", null]
 *               type:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [WORK, VACATION, SICK, SICK_CHILD, EDUCATION, PUBLIC_HOLIDAY, COMPENSATORY_OFF, SPECIAL_LEAVE, PARENTAL_LEAVE, UNPAID_LEAVE, ON_CALL]
 *                 example: ["WORK", "VACATION"]
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-31"
 *               is_confirmed:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Zeiteinträge erfolgreich abgerufen
 *       400:
 *         description: Validierungsfehler
 *       500:
 *         description: Serverfehler
 */
export const listTimeEntriesByFilters: UserRequestHandler = async (req, res, next) => {
  try {
    const { working_location, type, start_date, end_date, is_confirmed } =
      await bodySchema.validateAsync(req.body)

    const includeNull = working_location?.includes(null)
    const locationValues = working_location?.filter((l: string | null) => l !== null)

    const baseWhere: FindOptionsWhere<TimeEntry> = {
      time_account: { user: { id: req.user.id } },
      ...(type?.length && { type: In(type) }),
      ...(start_date && end_date && {
        start_date: Between(
          new Date(start_date),
          toEndOfDay(end_date)
        ),
      }),
      ...(start_date && !end_date && { start_date: MoreThanOrEqual(new Date(start_date)) }),
      ...(!start_date && end_date && { start_date: LessThanOrEqual(toEndOfDay(end_date)) }),
      ...(is_confirmed !== undefined && { is_confirmed }),
    }

    let whereConditions: FindOptionsWhere<TimeEntry>[]

    if (working_location?.length) {
      if (includeNull && locationValues?.length) {
        whereConditions = [
          { ...baseWhere, working_location: In(locationValues) },
          { ...baseWhere, working_location: IsNull() },
        ]
      } else if (includeNull) {
        whereConditions = [{ ...baseWhere, working_location: IsNull() }]
      } else {
        whereConditions = [{ ...baseWhere, working_location: In(locationValues) }]
      }
    } else {
      whereConditions = [baseWhere]
    }

    const timeEntries = await AppDataSource.getRepository(TimeEntry).find({
      where: whereConditions,
      select: {
        id: true,
        working_location: true,
        type: true,
        start_date: true,
        end_date: true,
        interruption_hours: true,
        recorded_hours: true,
        is_confirmed: true,
        created_at: true,
        updated_at: true,
      },
      order: { start_date: 'DESC' },
    })

    const timeAccount = await AppDataSource.getRepository(UserTimeAccount).findOne({
      where: { user: { id: req.user.id } },
    })
    if (!timeAccount) {
      return res.status(404).json({
        success: false,
        message: 'Kein Zeitkonto für diesen Benutzer gefunden.',
      })
    }

    const shouldWorkHoursPerDay = Math.round((timeAccount.contract_hours_per_week / timeAccount.working_days_per_week) * 100) / 100

    return res.status(200).json({
      success: true,
      data: timeEntries,
      shouldWorkHoursPerDay: shouldWorkHoursPerDay,
      timeAccount: timeAccount
    })

  } catch (error) {
    next(error)
  }
}