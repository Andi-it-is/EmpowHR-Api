// import { In, LessThanOrEqual } from "typeorm";
// import { AppDataSource } from "../../AppDataSource";
// import { User } from "../../entity/User";
// import { RefreshToken } from "../../entity/Token";
// import { APIError } from "../classes/APIError";
// import dayjs from "dayjs";
// import * as jwt from "jsonwebtoken";
// import * as dotenv from 'dotenv';
// dotenv.config();

// function toUuidWithId(uuid: string, id: number): string {
//     return uuid
// }

// export async function generate(
//     id: number
// ): Promise<{
//     refreshToken: string,
//     accessToken: string,
// }> {

//     const [
//         refreshToken,
//         accessToken
//     ] = await Promise.all([
//         _generateRefreshToken(id),
//         generateAccessToken(id),
//     ]);

//     return {
//         refreshToken: refreshToken,
//         accessToken: accessToken
//     };

// }

// export async function _generateRefreshToken(id: number): Promise<string> {

//     const authenticable = await AppDataSource
//         .getRepository(User)
//         .findOneBy({ id: id });

//     if (authenticable == null) {
//         throw new APIError(
//             "Es ist ein Serverfehler während der Verarbeitung aufgetreten",
//             "Bitte probiere es erneut",
//             500
//         );
//     }

//     const rT = new RefreshToken();
//     rT.user = authenticable;
//     rT.validUntil = dayjs().add(3, "months").toDate();

//     await AppDataSource.manager.save(rT);

//     return toUuidWithId(rT.token, rT.id);

// }

// export async function generateAccessToken(id: number): Promise<string> {

//     const authenticable = await AppDataSource
//         .getRepository(User)
//         .findOneBy({ id });

//     if (authenticable == null) {
//         throw new APIError(
//             "Es ist ein Serverfehler während der Verarbeitung aufgetreten",
//             "Bitte probiere es erneut",
//             500
//         );
//     }

//     const payload = {
//         ...authenticable,
//         _type: authenticable.constructor.name,
//     };

//     return jwt.sign(
//         payload,
//         process.env.JWT_ACCESSTOKEN_SECRET,
//         {
//             expiresIn: "60m"  //TODO Adjust this for wished JWT max expire date. 1 hour is standard
//         }
//     );

// }

// export async function _deactivateOld(id: number): Promise<void> {

//     const authenticable = await AppDataSource
//         .getRepository(User)
//         .findOneBy({ id });

//     if (!authenticable) {
//         return;
//     }

//     // Find all active refresh tokens which are expired.
//     const invalidRefreshtokens = await AppDataSource
//         .getRepository(RefreshToken)
//         .find({
//             where: {
//                 user: authenticable,
//                 isActive: true,
//                 validUntil: LessThanOrEqual(dayjs().toDate())
//             }
//         });

//     const ids = invalidRefreshtokens.map(r => r.id);

//     if (ids.length == 0) {
//         return;
//     }

//     await AppDataSource
//         .createQueryBuilder()
//         .update(RefreshToken)
//         .set({
//             isActive: false
//         })
//         .where({
//             id: In(ids)
//         })
//         .execute();

// }