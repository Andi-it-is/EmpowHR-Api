// import { Request, RequestHandler, Response } from "express";
// import { AppDataSource } from "../../../AppDataSource";
// import { User } from "../../../entity/User";
// import * as bcrypt from "bcrypt";
// import * as Joi from "joi";
// import { APIError } from "../../../lib/classes/APIError";
// import { hash } from "../../../lib/helpers/passwords";
// import { UserRoleEnum } from "../../../lib/enums/UserRoleEnum";

// const bodySchema = Joi.object({
//   username: Joi.string().required().min(3).max(20),
//   password: Joi.string().min(4).max(30).required(),
//   passwordRepeat: Joi.string().min(4).max(30).required(),
// })


// export const registerUser: RequestHandler = async (req: Request, res: Response, next) => {

//   try {
//     const body = await bodySchema.validateAsync(req.body)

//     if (body.password !== body.passwordRepeat) {
//       return new APIError("Passwörter müssen gleich sein", "s.o.", 403)
//     }

//     const existingUser = await AppDataSource
//       .getRepository(User)
//       .findOne({
//         where: {
//           username: body.username
//         }
//       })

//     if (existingUser) {
//       throw APIError.errorUserAlreadyExists()
//     }

//     const hashedPassword = await hash(body.password);

//     const user = new User()
//     user.username = body.username
//     user.password_hash = hashedPassword

//     // initally create acounts as User
//     // user.role = UserRoleEnum.USER

//     await AppDataSource.manager.save(user)

//     return res.status(200).json({
//       success: true,
//       username: user.username
//     })

//   } catch (error) {

//     if (error.isJoi) {
//       return res.status(400).json({
//         status: "Validation Error",
//         errors: error.details.map((detail: any) => detail.message)
//       });
//     } else {

//       return res.status(500).json({
//         message: "Internal server error",
//         error: error
//       });
//     }
//   }
// };