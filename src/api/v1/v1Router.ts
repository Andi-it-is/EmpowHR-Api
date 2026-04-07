import { Router } from "express";
import { userTokenChecker } from "../../lib/middleware/userTokenChecker";
import publicRouter from "./publicRoutes/router";
import userRouter from "./user/router";
import userMasterDataRouter from "./userMasterData/router";
import { contextMiddleware } from "../../lib/middleware/dbContextResolver";
import changeLogRouter from "./chnageLogHistory/router";

const router = Router()

// public routes
router.use("/public", publicRouter)

// protected routes
// express and db middlewares
router.use(userTokenChecker)
router.use(contextMiddleware)

router.use("/changelog", changeLogRouter)
router.use("/user", userRouter)
router.use("/userMasterData", userMasterDataRouter)


export default router;