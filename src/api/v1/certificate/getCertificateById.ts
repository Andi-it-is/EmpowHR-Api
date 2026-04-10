import path from 'path'
import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import Joi from 'joi'
import { Certificate } from '../../../entity/Certificate'


export const paramSchema = Joi.object({
  id: Joi.string().required(),
})

export const getCertificatesById: UserRequestHandler = async (req, res, next) => {
  try {

    const params = await paramSchema.validateAsync(req.params)

    const certificate = await AppDataSource.getRepository(Certificate).findOne({
      where: {
        id: params.id,
        user: { id: req.user.id }
      },
    })

    if (!certificate) return res.status(404).json({ success: false, message: 'Nicht gefunden' })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${certificate.title}.pdf"`)
    res.sendFile(path.resolve(certificate.file_path))

  } catch (error) {
    next(error)
  }
}