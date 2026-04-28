/** @format */

import { Router } from "express";
import { SubscriptionController } from "./controllers";
import { authenticate } from "../../middleware/authenticate";
import { Role } from "../../generated/prisma/enums";
import { authorize } from "../../middleware/authorize";

const router = Router();

// All subscription routes require auth
router.use(authenticate);

// Current user's subscription (any authenticated user)
router.get("/me", SubscriptionController.getMySubscription);

// Create subscription (ADMIN or SUPER_ADMIN)
router.post(
    "/",
    authorize(Role.SUPER_ADMIN),
    SubscriptionController.createSubscription,
);

// Get by ID — SUPER_ADMIN only
router.get(
    "/:id",
    authorize(Role.SUPER_ADMIN),
    SubscriptionController.getSubscriptionById,
);

// Upgrade / downgrade / change billing cycle
router.patch(
    "/:id",
    authorize(Role.SUPER_ADMIN, Role.DOCTOR, Role.ADMIN, Role.DOCTOR_ASSISTANT),
    SubscriptionController.updateSubscription,
);

// Cancel subscription
router.post(
    "/:id/cancel",
    authorize(Role.SUPER_ADMIN, Role.DOCTOR, Role.ADMIN, Role.DOCTOR_ASSISTANT),
    SubscriptionController.cancelSubscription,
);

export default router;
