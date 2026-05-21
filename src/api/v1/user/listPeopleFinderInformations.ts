
import { User } from "../../../entity/User";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";
import Joi from "joi";
import { PermissionScope } from "../../../lib/enums/acessControl.enum";
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope";
import { Department } from "../../../entity/Department";


export const listPeopleFinderInformations: UserRequestHandler = async (req, res, next) => {
  try {

    //* limited selects. all needed data
    const allRawDepartments = await AppDataSource.getRepository(Department).find()

    const usersWithInformations = await AppDataSource.getRepository(User)
      .find({
        select: {
          id: true,
          firstname: true,
          lastname: true,
          gender: true,
          email: true,
          disabled: true,
          master_data: {
            company_alias: true,
            telephone_business: true,
            job_title: true,
            started_working_date: true,
            city: true,
            country: true
          }
        },
        relations: {
          master_data: true,
          department: true
        }
      })

    //* < Block to determine allowed Scope per route >
    const isScopeAllowed = await checkPermissionScope({
      requestingUserId: req.user.id,
      allowedScope: req.maxTargetPermissionScope,
      resolveTargetUserId: () => req.user.id,
      resolveTargetDepartmentId: () => req.user.department.id,
    })

    if (!isScopeAllowed) {
      return res.status(403).json({ success: false, message: "Keine Berechtigung für diese Aktion." })
    }
    //* < /Block to determine allowed Scope per route >


    return res.status(200).json({
      success: true,
      departments: allRawDepartments,
      users: usersWithInformations
    });

  } catch (error) {
    next(error);
  }
};