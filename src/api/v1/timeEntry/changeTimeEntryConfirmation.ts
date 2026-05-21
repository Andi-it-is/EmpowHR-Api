import { TimeEntry } from "../../../entity/TimeEntry";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";
import Joi from "joi";
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope";

const paramsSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const bodySchema = Joi.object({
  is_confirmed: Joi.boolean().required(),
});

/**
 * @swagger
 * /time-entry/{id}/confirmation:
 *   patch:
 *     summary: Zeiteintrag bestätigen oder ablehnen
 *     tags:
 *       - TimeEntry
 */
export const changeTimeEntryConfirmation: UserRequestHandler = async (req, res, next) => {
  try {
    const { error: paramsError, value: params } = paramsSchema.validate(req.params);
    if (paramsError) {
      return res.status(400).json({ success: false, message: paramsError.details[0].message });
    }

    const { error: bodyError, value: body } = bodySchema.validate(req.body);
    if (bodyError) {
      return res.status(400).json({ success: false, message: bodyError.details[0].message });
    }

    const timeEntryRepo = AppDataSource.getRepository(TimeEntry);

    const entry = await timeEntryRepo.findOne({
      where: { id: params.id },
      relations: { time_account: { user: true } },
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: "Zeiteintrag nicht gefunden." });
    }

    //* < Block to determine allowed Scope per route >
    const isScopeAllowed = await checkPermissionScope({
      requestingUserId: req.user.id,
      allowedScope: req.maxTargetPermissionScope,
      resolveTargetUserId: () => entry.time_account.user.id,
      resolveTargetDepartmentId: () => req.user.department.id,
    });

    if (!isScopeAllowed) {
      return res.status(403).json({ success: false, message: "Keine Berechtigung für diese Aktion." });
    }
    //* < /Block to determine allowed Scope per route >

    entry.is_confirmed = body.is_confirmed;
    const updated = await timeEntryRepo.save(entry);

    return res.status(200).json({
      success: true,
      data: {
        id: updated.id,
        is_confirmed: updated.is_confirmed,
      },
    });

  } catch (error) {
    next(error);
  }
};