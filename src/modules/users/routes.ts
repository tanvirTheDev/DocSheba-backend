/** @format */

import { Router } from "express";
import {
    listUsersController,
    getUserByIdController,
    updateUserController,
    changeUserStatusController,
    deactivateUserController,
    listAssistantsController,
    assignAssistantController,
    removeAssistantController,
} from "./controllers";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

const router = Router();

// All user routes require authentication
router.use(authenticate);

// ─── Admin / Super Admin only ─────────────────────────────────────────────────
router.get(
    "/",
    /*TODO: authorize("ADMIN", "SUPER_ADMIN"), */ listUsersController,
);

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

// ─── Doctor ↔ Assistant Management ───────────────────────────────────────────

/**
 * GET /users/doctors/:doctorId/assistants
 * List all assistants linked to a doctor.
 * Doctor can see their own assistants; admin can see any.
 */
router.get(
    "/doctors/:doctorId/assistants",
    authorize("DOCTOR", "ADMIN", "SUPER_ADMIN"),
    listAssistantsController,
);

/**
 * POST /users/doctors/:doctorId/assistants
 * Assign a DOCTOR_ASSISTANT user to a doctor.
 * Admin only — doctors cannot assign their own assistants.
 */
router.post(
    "/doctors/:doctorId/assistants",
    authorize("DOCTOR", "ADMIN", "SUPER_ADMIN"),
    assignAssistantController,
);

/**
 * DELETE /users/doctors/:doctorId/assistants/:assistantId
 * Remove the link between a doctor and an assistant.
 * Admin only.
 */
router.delete(
    "/doctors/:doctorId/assistants/:assistantId",
    authorize("DOCTOR", "ADMIN", "SUPER_ADMIN"),
    removeAssistantController,
);
export default router;
