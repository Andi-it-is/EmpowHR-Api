// import { APIError } from "../classes/APIError";
// import * as jwt from "jsonwebtoken";
// import { AppDataSource } from "../../AppDataSource";
// import { UserRequestHandler } from "../classes/UserRequestHandler";
// import { User } from "../../entity/User";

// export const userTokenChecker: UserRequestHandler = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader?.startsWith("Bearer ")) {
//       return res.status(401).json({ success: false, message: "No token provided" });
//     }

//     const token = authHeader.split(" ")[1];
    
//     // 1. Verify Token
//     const decoded = jwt.verify(token, process.env.JWT_ACCESSTOKEN_SECRET!) as { userId: number };

//     // 2. Fetch User from DB (include role)
//     const userRepository = AppDataSource.getRepository(User);
//     const user = await userRepository.findOneBy({ id: decoded.userId });

//     if (!user) {
//       return res.status(401).json({ success: false, message: "User not found" });
//     }

//     // 3. Attach to request (Type-casted via your interface)
//     req.user = user;
//     req.role = user.role;

//     next(); // Proceed to the route handler
    
//   } catch (error) {

//     return res.status(401).json({
//       success: false,
//       message: 'Provided Token could not be authorized',
//       error: error
//     });
//   }
// };