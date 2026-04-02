import { Router } from "express";

// import { userTokenChecker } from "../../lib/middleware/tokenChecker";
import publicRouter from "./publicRoutes/router";
import userRouter from "./user/router";

const router = Router()

router.use("/public", publicRouter)

// router use token checker

// router.use("/user", userTokenChecker, userRouter)

// saved routes

export default router;