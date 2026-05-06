import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { TimeEntry } from "../../../entity/TimeEntry"
import { UserTimeAccount } from "../../../entity/UserTimeAccount"
import Joi from 'joi'

const paramSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  entryId: Joi.string().uuid().required(),
})

/**
 * @swagger
 * /timeEntry/other/{userId}/{entryId}:
 *   delete:
 *     summary: Zeiteintrag eines anderen Benutzers löschen
 *     description: Löscht einen bestehenden Zeiteintrag eines bestimmten Benutzers. Nur für HR-Berechtigte.
 *     tags:
 *       - TimeEntries
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID des Benutzers
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID des zu löschenden Zeiteintrags
 *     responses:
 *       200:
 *         description: Zeiteintrag erfolgreich gelöscht
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Zeiteintrag erfolgreich gelöscht."
 *       404:
 *         description: Zeiteintrag nicht gefunden
 *       500:
 *         description: Interner Serverfehler
 */
export const deleteTimeEntryByUserId: UserRequestHandler = async (req, res, next) => {
  try {
    const { userId, entryId } = await paramSchema.validateAsync(req.params)

    const timeAccount = await AppDataSource.getRepository(UserTimeAccount).findOne({
      where: { user: { id: userId } },
    })

    if (!timeAccount) {
      return res.status(404).json({
        success: false,
        message: 'Kein Zeitkonto für diesen Benutzer gefunden.',
      })
    }

    const timeEntry = await AppDataSource.getRepository(TimeEntry).findOne({
      where: { id: entryId, time_account: { id: timeAccount.id } },
    })

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Zeiteintrag nicht gefunden.',
      })
    }

    await AppDataSource.getRepository(TimeEntry).delete({ id: entryId })

    return res.status(200).json({
      success: true,
      message: 'Zeiteintrag erfolgreich gelöscht.',
    })

  } catch (error) {
    next(error)
  }
}