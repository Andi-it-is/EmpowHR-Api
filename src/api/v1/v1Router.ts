import { Router } from "express";
import { userTokenChecker } from "../../lib/middleware/userTokenChecker";
import publicRouter from "./publicRoutes/router";
import userRouter from "./user/router";
import userMasterDataRouter from "./userMasterData/router";
import { contextMiddleware } from "../../lib/middleware/dbContextResolver";
import changeLogRouter from "./chnageLogHistory/router";
import documentRouter from "./document/router";
import certificateRouter from "./certificate/router";
import timeEntryRouter from "./timeEntry/router";
import userTimeAccountRouter from "./userTimeAccount/router";
import rolesRouter from "./role/router";
import permissionRouter from "./permission/router";
import departmentRouter from "./department/router";

const router = Router()
/**
 ** Note: Static routes need to be registered first, before dynamic routes
 ** e.g.  /route/all   > /route/:id
 */

// public routes
router.use("/public", publicRouter)

// protected routes
// express and db middlewares
router.use(userTokenChecker)
router.use(contextMiddleware)

router.use("/changelog", changeLogRouter)
router.use("/certificate", certificateRouter)
router.use("/department", departmentRouter)
router.use("/document", documentRouter)
router.use("/permission", permissionRouter)
router.use("/role", rolesRouter)
router.use("/timeEntry", timeEntryRouter)
router.use("/user", userRouter)
router.use("/userMasterData", userMasterDataRouter)
router.use("/userTimeAccount", userTimeAccountRouter)
export default router;