import { Router } from "express";
import { userTokenChecker } from "../../lib/middleware/userTokenChecker";
import publicRouter from "./publicRoutes/router";
import userRouter from "./user/router";

const router = Router()

// public routes
router.use("/public", publicRouter)

// protected routes
router.use("/user", userTokenChecker, userRouter)


export default router;