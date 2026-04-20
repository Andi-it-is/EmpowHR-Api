import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { TimeEntry } from "../../../entity/TimeEntry"
import { UserTimeAccount } from "../../../entity/UserTimeAccount"
import Joi from 'joi'

const paramSchema = Joi.object({
  id: Joi.string().uuid().required(),
})

/**
 * @swagger
 * /timeEntry/my/{id}:
 *   delete:
 *     summary: Zeiteintrag löschen
 *     description: Löscht einen bestehenden Zeiteintrag des eingeloggten Benutzers.
 *     tags:
 *       - TimeEntries
 *     parameters:
 *       - in: path
 *         name: id
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
export const deleteTimeEntry: UserRequestHandler = async (req, res, next) => {
  try {
    const { id } = await paramSchema.validateAsync(req.params)

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

    await AppDataSource.getRepository(TimeEntry).delete({ id })

    return res.status(200).json({
      success: true,
      message: 'Zeiteintrag erfolgreich gelöscht.',
    })

  } catch (error) {
    next(error)
  }
}