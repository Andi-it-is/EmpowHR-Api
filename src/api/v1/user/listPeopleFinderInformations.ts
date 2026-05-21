
import { User } from "../../../entity/User";
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler";
import { AppDataSource } from "../../../AppDataSource";
import Joi from "joi";
import { PermissionScope } from "../../../lib/enums/acessControl.enum";
import { checkPermissionScope } from "../../../lib/helpers/checkPermissionScope";
import { Department } from "../../../entity/Department";

/**
 * @swagger
 * /users/people-finder:
 *   get:
 *     summary: Gibt alle relevanten Informationen für den People Finder aus
 *     description: >
 *       Liefert eine Liste aller Abteilungen und aller Benutzer inklusive eingeschränkter Stammdaten (Master Data).
 *       Zugriff wird über das Permission-Scope-System validiert.
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: Daten erfolgreich geladen.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 departments:
 *                   type: array
 *                   description: Liste aller Abteilungen im System
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
 *                       name:
 *                         type: string
 *                         example: "IT-Abteilung"
 *                 users:
 *                   type: array
 *                   description: Liste der Benutzer mit limitierten Profilfeldern
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "42a1deb4-3b7d-4bad-9bdd-2b0d7b3dcb6d"
 *                       firstname:
 *                         type: string
 *                         example: "Max"
 *                       lastname:
 *                         type: string
 *                         example: "Mustermann"
 *                       gender:
 *                         type: string
 *                         enum: [male, female, "-"]
 *                         example: "male"
 *                       email:
 *                         type: string
 *                         format: email
 *                         example: "max.mustermann@company.com"
 *                       disabled:
 *                         type: boolean
 *                         example: false
 *                       master_data:
 *                         type: object
 *                         properties:
 *                           company_alias:
 *                             type: string
 *                             example: "MMU"
 *                           telephone_business:
 *                             type: string
 *                             example: "+49 123 456789"
 *                           job_title:
 *                             type: string
 *                             example: "Senior Fullstack Developer"
 *                           started_working_date:
 *                             type: string
 *                             format: date
 *                             example: "2024-01-15"
 *                           city:
 *                             type: string
 *                             example: "Düsseldorf"
 *                           country:
 *                             type: string
 *                             example: "Germany"
 *                       department:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
 *       403:
 *         description: Fehlende Berechtigung (Permission Scope nicht ausreichend).
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
 *                   example: "Keine Berechtigung für diese Aktion."
 *       500:
 *         description: Interner Serverfehler.
 */
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