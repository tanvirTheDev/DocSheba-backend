/** @format */

import { Router } from "express";
import {
    listAppointmentsController,
    getAppointmentByIdController,
    createAppointmentController,
    updateAppointmentController,
    cancelAppointmentController,
    startCallController,
    endCallController,
} from "./controllers";
import { authenticate } from "../../middleware/authenticate";
import { authorize }    from "../../middleware/authorize";

const router = Router();

router.use(authenticate);

// ─── List & Create ────────────────────────────────────────────────────────────

/**
 * GET /appointments
 * Role-scoped: patients see their own, doctors see their own,
 * assistants see their doctor's, admins see all.
 */
router.get(
    "/",
    // authorize("PATIENT", "DOCTOR", "DOCTOR_ASSISTANT", "ADMIN", "SUPER_ADMIN"),
    listAppointmentsController,
);

/**
 * POST /appointments
 * Patients book for themselves.
 * Assistants and admins can book on behalf of any patient.
 */
router.post(
    "/",
    // authorize("PATIENT", "DOCTOR_ASSISTANT", "ADMIN", "SUPER_ADMIN"),
    createAppointmentController,
);

// ─── Single Appointment ───────────────────────────────────────────────────────

/**
 * GET /appointments/:id
 * Ownership check enforced in service layer.
 */
router.get(
    "/:id",
    // authorize("PATIENT", "DOCTOR", "DOCTOR_ASSISTANT", "ADMIN", "SUPER_ADMIN"),
    getAppointmentByIdController,
);

/**
 * PATCH /appointments/:id
 * Doctor, assistant, or admin can update.
 * Blocked on CANCELLED or COMPLETED appointments.
 */
router.patch(
    "/:id",
    // authorize("DOCTOR", "DOCTOR_ASSISTANT", "ADMIN", "SUPER_ADMIN"),
    updateAppointmentController,
);

/**
 * DELETE /appointments/:id
 * Soft-cancel — sets status to CANCELLED.
 * Patient can cancel their own; doctor/assistant/admin can cancel any.
 */
router.delete(
    "/:id",
    // authorize("PATIENT", "DOCTOR", "DOCTOR_ASSISTANT", "ADMIN", "SUPER_ADMIN"),
    cancelAppointmentController,
);

// ─── Call Session ─────────────────────────────────────────────────────────────

/**
 * POST /appointments/:id/call/start
 * Only for VIDEO_CALL or AUDIO_CALL appointments.
 * Must be CONFIRMED. Generates room ID, sets callStartedAt, moves to IN_PROGRESS.
 */
router.post(
    "/:id/call/start",
    // authorize("DOCTOR", "ADMIN", "SUPER_ADMIN"),
    startCallController,
);

/**
 * POST /appointments/:id/call/end
 * Must be IN_PROGRESS.
 * Sets callEndedAt, calculates callDurationMin, moves to COMPLETED.
 */
router.post(
    "/:id/call/end",
    // authorize("DOCTOR", "ADMIN", "SUPER_ADMIN"),
    endCallController,
);

export default router;