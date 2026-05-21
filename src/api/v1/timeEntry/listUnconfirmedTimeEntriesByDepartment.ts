import { Department } from "../../../entity/Department";
import { TimeEntry } from "../../../entity/TimeEntry";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";
import Joi from "joi";
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope";

const paramsSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

/**
 * @swagger
 * /department/{id}/time-entries/unconfirmed:
 *   get:
 *     summary: Unbestätigte Zeiteinträge einer Abteilung
 *     tags:
 *       - Department
 */
export const listUnconfirmedTimeEntriesByDepartment: UserRequestHandler = async (req, res, next) => {
  try {
    const { error: paramsError, value: params } = paramsSchema.validate(req.params);
    if (paramsError) {
      return res.status(400).json({ success: false, message: paramsError.details[0].message });
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
      relations: { users: { time_account: true } },
    });

    if (!department) {
      return res.status(404).json({ success: false, message: "Abteilung nicht gefunden." });
    }

    const timeAccountIds = department.users
      .map((u) => u.time_account?.id)
      .filter(Boolean) as string[];

    if (timeAccountIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const entries = await AppDataSource.getRepository(TimeEntry)
      .createQueryBuilder("entry")
      .leftJoinAndSelect("entry.time_account", "time_account")
      .leftJoinAndSelect("time_account.user", "user")
      .where("time_account.id IN (:...ids)", { ids: timeAccountIds })
      .andWhere("entry.is_confirmed = :confirmed", { confirmed: false })
      .orderBy("entry.start_date", "ASC")
      .getMany();

    const data = entries.map((e) => ({
      id: e.id,
      type: e.type,
      working_location: e.working_location,
      start_date: e.start_date,
      end_date: e.end_date,
      recorded_hours: e.recorded_hours,
      interruption_hours: e.interruption_hours,
      is_confirmed: e.is_confirmed,
      user: {
        id: e.time_account.user.id,
        firstname: e.time_account.user.firstname,
        lastname: e.time_account.user.lastname,
        email: e.time_account.user.email,
      },
    }));

    return res.status(200).json({ success: true, data });

  } catch (error) {
    next(error);
  }
};