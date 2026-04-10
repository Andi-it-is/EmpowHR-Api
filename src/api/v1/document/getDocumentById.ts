import path from 'path'
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { Document } from "../../../entity/Document"
import Joi from 'joi'


export const paramSchema = Joi.object({
  id: Joi.string().required(),
})

export const getDocumentById: UserRequestHandler = async (req, res, next) => {
  try {

    const params = await paramSchema.validateAsync(req.params)

    const doc = await AppDataSource.getRepository(Document).findOne({
      where: {
        id: params.id,

        user: { id: req.user.id }
      },
    })

    if (!doc) return res.status(404).json({ success: false, message: 'Nicht gefunden' })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${doc.title}.pdf"`)
    res.sendFile(path.resolve(doc.file_path))

  } catch (error) {
    next(error)
  }
}