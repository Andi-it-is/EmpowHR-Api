import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { Document } from "../../../entity/Document"
import Joi from 'joi'
import { DocumentSecurityLevel, DocumentType } from "../../../lib/enums/acessControl.enum"


export const listDocuments: UserRequestHandler = async (req, res, next) => {
  try {
    const id = req.user.id

    const documents = await AppDataSource.getRepository(Document).find({
      where: { user: { id } },
      select: {
        id: true,
        title: true,
        type: true,
        security_level: true,
        created_at: true,
        updated_at: true,
        // file_path bewusst weggelassen
      },
      order: { created_at: 'DESC' }
    })

    return res.status(200).json({
      success: true,
      data: documents
    })

  } catch (error) {
    next(error)
  }
}