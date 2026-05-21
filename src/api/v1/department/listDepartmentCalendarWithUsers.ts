import { Department } from "../../../entity/Department";
import { TimeEntry } from "../../../entity/TimeEntry";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";
import Joi from "joi";
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope";
import { Between } from "typeorm";

const paramsSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const bodySchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2000).max(2100).required(),
});


/**
 * @swagger
 * /department/list/teamcalendar/:id:
 *   post:
 *     summary: Abteilungskalender mit vollständigen Einträgen
 *     description: >
 *       Gibt alle Zeiteinträge der Mitarbeiter einer Abteilung für einen bestimmten Monat zurück.
 *       Alle Einträge sind vollständig sichtbar (Typ, Stunden, Arbeitsort).
 *       Nur für Berechtigte mit Zugriff auf die gesamte Abteilung.
 *     tags:
 *       - Department
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID der Abteilung
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - month
 *               - year
 *             properties:
 *               month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 5
 *               year:
 *                 type: integer
 *                 minimum: 2000
 *                 maximum: 2100
 *                 example: 2026
 *     responses:
 *       200:
 *         description: Kalender erfolgreich abgerufen
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
 *                     name:
 *                       type: string
 *                       example: "IT"
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           firstname:
 *                             type: string
 *                           lastname:
 *                             type: string
 *                           email:
 *                             type: string
 *                           timeEntries:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   format: uuid
 *                                 type:
 *                                   type: string
 *                                   enum: [WORK, VACATION, SICK, SICK_CHILD, EDUCATION, PUBLIC_HOLIDAY, COMPENSATORY_OFF, SPECIAL_LEAVE, PARENTAL_LEAVE, UNPAID_LEAVE, ON_CALL]
 *                                 working_location:
 *                                   type: string
 *                                   enum: [OFFICE, REMOTE, FIELD_SERVICE]
 *                                   nullable: true
 *                                 start_date:
 *                                   type: string
 *                                   format: date-time
 *                                 end_date:
 *                                   type: string
 *                                   format: date-time
 *                                 recorded_hours:
 *                                   type: number
 *                                 interruption_hours:
 *                                   type: number
 *                                 is_confirmed:
 *                                   type: boolean
 *       400:
 *         description: Validierungsfehler
 *       403:
 *         description: Keine Berechtigung
 *       404:
 *         description: Abteilung nicht gefunden
 *       500:
 *         description: Serverfehler
 */
export const listDepartmentCalendarWithUsers: UserRequestHandler = async (req, res, next) => {
  try {
    const { error: paramsError, value: params } = paramsSchema.validate(req.params);
    if (paramsError) {
      return res.status(400).json({ success: false, message: paramsError.details[0].message });
    }

    const { error: bodyError, value: body } = bodySchema.validate(req.body, { abortEarly: false });
    if (bodyError) {
      return res.status(400).json({ success: false, message: bodyError.details.map((d) => d.message) });
    }

    //* < Block to determine allowed Scope per route >
    const isScopeAllowed = await checkPermissionScope({
      requestingUserId: req.user.id,
      allowedScope: req.maxTargetPermissionScope,
      resolveTargetUserId: () => req.user.id,
      resolveTargetDepartmentId: () => params.id,
    });

    if (!isScopeAllowed) {
      return res.status(403).json({ success: false, message: "Keine Berechtigung für diese Aktion." });
    }
    //* < /Block to determine allowed Scope per route >

    const department = await AppDataSource.getRepository(Department).findOne({
      where: { id: params.id },
      relations: {
        users: {
          time_account: true,
        },
      },
    });

    if (!department) {
      return res.status(404).json({ success: false, message: "Abteilung nicht gefunden." });
    }

    // Monatsbereich berechnen
    const start = new Date(body.year, body.month - 1, 1);   // 1. des Monats 00:00:00
    const end = new Date(body.year, body.month, 1);          // 1. des Folgemonats 00:00:00 (exklusiv)

    const timeEntryRepo = AppDataSource.getRepository(TimeEntry);

    // TimeEntries für alle User der Abteilung in einem Query laden
    const timeAccountIds = department.users
      .map((u) => u.time_account?.id)
      .filter(Boolean) as string[];

    const allEntries = timeAccountIds.length > 0
      ? await timeEntryRepo
        .createQueryBuilder("entry")
        .leftJoinAndSelect("entry.time_account", "time_account")
        .where("time_account.id IN (:...ids)", { ids: timeAccountIds })
        .andWhere("entry.start_date < :end", { end })      // startet VOR Monatsende
        .andWhere("entry.end_date >= :start", { start })   // endet NACH Monatsanfang
        .andWhere("entry.working_location IS NULL")
        .getMany()
      : [];

    // Entries nach time_account.id gruppieren für O(1) Lookup
    const entriesByAccountId = allEntries.reduce<Record<string, TimeEntry[]>>((acc, entry) => {
      const accountId = entry.time_account.id;
      if (!acc[accountId]) acc[accountId] = [];
      acc[accountId].push(entry);
      return acc;
    }, {});

    // Response zusammenbauen
    const users = department.users.map((user) => {
      const entries = user.time_account
        ? (entriesByAccountId[user.time_account.id] ?? [])
        : [];

      return {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        timeEntries: entries.map((e) => ({
          id: e.id,
          type: e.type,
          working_location: e.working_location,
          start_date: e.start_date,
          end_date: e.end_date,
          recorded_hours: e.recorded_hours,
          interruption_hours: e.interruption_hours,
          is_confirmed: e.is_confirmed,
        })),
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        id: department.id,
        name: department.name,
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};