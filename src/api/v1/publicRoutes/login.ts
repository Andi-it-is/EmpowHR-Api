// import { Request, RequestHandler, Response } from "express";
// import { AppDataSource } from "../../../AppDataSource";
// import { User } from "../../../entity/User";
// import * as bcrypt from "bcrypt";
// import * as Joi from "joi";
// import { APIError } from "../../../lib/classes/APIError";
// import { compare, hash } from "../../../lib/helpers/passwords";
// import { UserRoleEnum } from "../../../lib/enums/UserRoleEnum";
// import { _deactivateOld, generateAccessToken, generate } from "../../../lib/helpers/tokens";
// import { refreshTokenService } from "../../../services/refreshTokenservice";

// const bodySchema = Joi.object({
//   username: Joi.string().required().min(3).max(20),
//   password: Joi.string().min(4).max(30).required(),
// })


// export const login: RequestHandler  = async (req: Request, res: Response, next) => {

//   try {
//     const body = await bodySchema.validateAsync(req.body)

//     const user = await AppDataSource
//         .getRepository(User)
//         .createQueryBuilder("user")
//         .where("user.username = :username", { username: body.username })
//         .addSelect("user.passwordHash") // explicitly include password
//         .getOne();
    
//     if (!user) {
//       throw APIError.errorWrongLoginCredentials()
//     }

//     if (user.disabled) {
//       throw APIError.errorIsDeactivated();
//     }

//     const passwordMatch = await compare(body.password, user.passwordHash);
//     if (!passwordMatch) {
//         user.failedLoginTries += 1;

//         // This will only happen once and then the deactivate message will be shown.
//         if (user.failedLoginTries > 4) {
//             user.disabled = true;
//             await AppDataSource.manager.save(user);
//             throw APIError.errorTooManyFailedLoginTries();
//         }

//         await AppDataSource.manager.save(user);
//         throw APIError.errorWrongLoginCredentials();
//     }

//     // reset users failedLoginTries
//     user.failedLoginTries = 0;
//     await AppDataSource.manager.save(user);


//     // Deactivate old refresh tokens
//     await _deactivateOld(user.id);
//     const refreshToken = await refreshTokenService.findActiveTokenByUserId(user.id);

//     if (refreshToken){
//         // If a valid refresh token exists, we return it.
//         // This is useful for the client to keep the session alive.
//         return res.status(200).json({ 
//             refreshToken: `${refreshToken.token}?${refreshToken.id}`,
//             accessToken: await generateAccessToken(user.id)
//         });
//     } else {
//         const tokens = await generate(user.id);
//         return res.status(200).json(tokens)
//     }

//   } catch (error) {

//     if (error.isJoi) {
//       return res.status(400).json({
//           status: "Validation Error",
//           errors: error.details.map((detail: any) => detail.message)
//       });
//     } else {

//       return res.status(500).json({
//         message: "Internal server error",
//         error: error
//       });
//     }
//   }
// };