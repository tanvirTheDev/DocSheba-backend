/** @format */

import { Router } from "express";
import { SaasPlanController } from "./controllers";

import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { Role } from "../../generated/prisma/enums";

const router = Router();

// Public — no auth required
router.get("/", SaasPlanController.listPlans);
router.get("/:id", SaasPlanController.getPlanById);

// Super-admin only
router.post(
    "/",
    authenticate,
    authorize(Role.SUPER_ADMIN),
    SaasPlanController.createPlan,
);
router.patch(
    "/:id",
    authenticate,
    authorize(Role.SUPER_ADMIN),
    SaasPlanController.updatePlan,
);

export default router;
