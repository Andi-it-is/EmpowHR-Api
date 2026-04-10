import { UserRequestHandler } from "../../../lib/classes/UserRequestHandler"
import { AppDataSource } from "../../../AppDataSource"
import { Document } from "../../../entity/Document"
import Joi from 'joi'
import { DocumentSecurityLevel, DocumentType } from "../../../lib/enums/acessControl.enum"
import { Certificate } from "../../../entity/Certificate"


export const listCertificates: UserRequestHandler = async (req, res, next) => {
  try {
    const id = req.user.id

    const certificates = await AppDataSource.getRepository(Certificate).find({
      where: { user: { id } },
      select: {
        id: true,
        title: true,
        description: true,
        // file_path bewusst weggelassen
        issued_at: true,
        expires_at: true,
        created_at: true,
        updated_at: true,
        user: true
      },
      order: { created_at: 'DESC' }
    })

    return res.status(200).json({
      success: true,
      data: certificates
    })

  } catch (error) {
    next(error)
  }
}