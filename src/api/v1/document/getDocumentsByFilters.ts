import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { Document } from "../../../entity/Document"
import { DocumentSecurityLevel, DocumentType } from "../../../lib/enums/acessControl.enum"
import { Between, In, MoreThanOrEqual, LessThanOrEqual, FindOptionsWhere } from "typeorm"
import Joi from 'joi'

const bodySchema = Joi.object({
  type: Joi.array().items(Joi.string().valid(...Object.values(DocumentType))).optional(),
  security_level: Joi.array().items(Joi.string().valid(...Object.values(DocumentSecurityLevel))).optional(),
  date_from: Joi.string().isoDate().optional(),
  date_to: Joi.string().isoDate().optional(),
})

export const getDocumentsByFilter: UserRequestHandler = async (req, res, next) => {
  try {
    const { type, security_level, date_from, date_to } = await bodySchema.validateAsync(req.body)

    console.log(req.body)

    const documents = await AppDataSource.getRepository(Document).find({
      where: {
        user: { id: req.user.id },
        ...(type?.length && { type: In(type) }),
        ...(security_level?.length && { security_level: In(security_level) }),
        ...(date_from && date_to && {
          created_at: Between(
            new Date(date_from),
            new Date(new Date(date_to).setDate(new Date(date_to).getDate() + 1))
          )
        }),
        ...(date_from && !date_to && { created_at: MoreThanOrEqual(new Date(date_from)) }),
        ...(!date_from && date_to && { created_at: LessThanOrEqual(new Date(date_to)) }),
      } satisfies FindOptionsWhere<Document>,
      select: {
        id: true,
        title: true,
        type: true,
        security_level: true,
        created_at: true,
        updated_at: true,
      },
      order: { created_at: 'DESC' }
    })

    console.log(documents)

    return res.status(200).json({
      success: true,
      data: documents
    })

  } catch (error) {
    next(error)
  }
}