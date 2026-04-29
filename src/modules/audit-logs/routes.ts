/** @format */

import { Router } from "express";
import * as AuditLogController from "./controllers";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

const router = Router();

router.use(authenticate, authorize("ADMIN", "SUPER_ADMIN"));

router.get("/", AuditLogController.listAuditLogs);
router.get("/:id", AuditLogController.getAuditLogById);

export default router;
