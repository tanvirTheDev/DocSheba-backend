/** @format */

import { Router } from "express";
import {
    listUsersController,
    getUserByIdController,
    updateUserController,
    changeUserStatusController,
    deactivateUserController,
} from "./controllers";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

const router = Router();

// All user routes require authentication
router.use(authenticate);

// ─── Admin / Super Admin only ─────────────────────────────────────────────────
router.get("/", authorize("ADMIN", "SUPER_ADMIN"), listUsersController);

// ─── Any authenticated user (own) or Admin ────────────────────────────────────
router.get(
    "/:id",
    authorize("ADMIN", "SUPER_ADMIN", "DOCTOR", "PATIENT", "DOCTOR_ASSISTANT"),
    getUserByIdController,
);

router.patch(
    "/:id",
    authorize("ADMIN", "SUPER_ADMIN", "DOCTOR", "PATIENT", "DOCTOR_ASSISTANT"),
    updateUserController,
);

// ─── Admin / Super Admin only ─────────────────────────────────────────────────
router.patch(
    "/:id/status",
    authorize("ADMIN", "SUPER_ADMIN"),
    changeUserStatusController,
);

router.delete(
    "/:id",
    authorize("ADMIN", "SUPER_ADMIN"),
    deactivateUserController,
);

export default router;
