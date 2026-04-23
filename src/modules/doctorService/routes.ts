/** @format */

import { Router } from "express";
import {
    getDoctorProfileController,
    upsertDoctorProfileController,
    listDoctorServicesController,
    addDoctorServiceController,
    updateDoctorServiceController,
    deleteDoctorServiceController,
} from "./controllers";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

const router = Router();

router.use(authenticate);

// ─── Doctor Profile ───────────────────────────────────────────────────────────

/**
 * GET /doctors/:userId/profile
 * Any authenticated user can view a doctor's profile.
 * Used by patients during booking, admins for management.
 */
router.get(
    "/:userId/profile",
    authorize("PATIENT", "DOCTOR", "DOCTOR_ASSISTANT", "ADMIN", "SUPER_ADMIN"),
    getDoctorProfileController,
);

/**
 * PUT /doctors/:userId/profile
 * Doctor can manage their own profile.
 * Admin / Super Admin can manage any doctor's profile.
 * Ownership check is enforced inside the service layer.
 */
router.put(
    "/:userId/profile",
    authorize("DOCTOR", "ADMIN", "SUPER_ADMIN"),
    upsertDoctorProfileController,
);

// ─── Doctor Services ──────────────────────────────────────────────────────────

/**
 * GET /doctors/:doctorId/services
 * Any authenticated user can list a doctor's services.
 * Used by patients when choosing a service to book.
 */
router.get(
    "/:doctorId/services",
    authorize("PATIENT", "DOCTOR", "DOCTOR_ASSISTANT", "ADMIN", "SUPER_ADMIN"),
    listDoctorServicesController,
);

/**
 * POST /doctors/:doctorId/services
 * Doctor can add services to their own catalogue.
 * Admin / Super Admin can add services to any doctor's catalogue.
 */
router.post(
    "/:doctorId/services",
    authorize("DOCTOR", "ADMIN", "SUPER_ADMIN"),
    addDoctorServiceController,
);

/**
 * PATCH /doctors/:doctorId/services/:serviceId
 * Update fee, duration, description, or isActive flag.
 * Doctor can only update their own services.
 */
router.patch(
    "/:doctorId/services/:serviceId",
    authorize("DOCTOR", "ADMIN", "SUPER_ADMIN"),
    updateDoctorServiceController,
);

/**
 * DELETE /doctors/:doctorId/services/:serviceId
 * Hard delete — blocked if the service has linked appointments.
 * Use PATCH isActive: false to deactivate instead.
 */
router.delete(
    "/:doctorId/services/:serviceId",
    authorize("DOCTOR", "ADMIN", "SUPER_ADMIN"),
    deleteDoctorServiceController,
);

export default router;
