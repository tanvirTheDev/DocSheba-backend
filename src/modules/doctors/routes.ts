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
import upload from "../../middleware/multer";

const router = Router();

router.use(authenticate);

// ─── Doctor Profile ───────────────────────────────────────────────────────────

// Public-ish — any authenticated user can view a doctor profile
router.get(
    "/:userId/profile",
    authenticate,
    authorize("PATIENT", "DOCTOR", "DOCTOR_ASSISTANT", "ADMIN", "SUPER_ADMIN"),
    getDoctorProfileController,
);

// Only the doctor themselves or an admin can upsert
router.patch(
    "/:userId/profile",
    authenticate,
    authorize("DOCTOR", "ADMIN", "SUPER_ADMIN"),
    upsertDoctorProfileController,
);

router.patch(
    "/:userId/profile",
    authenticate,
    authorize("DOCTOR", "ADMIN", "SUPER_ADMIN"),
    upload.fields([
        { name: "profileImage", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
        { name: "signatureImage", maxCount: 1 },
    ]),
    upsertDoctorProfileController,
);

// ─── Doctor Services ──────────────────────────────────────────────────────────

// Any authenticated user can list a doctor's services (for booking)
router.get(
    "/:doctorId/services",
    authenticate,
    authorize("PATIENT", "DOCTOR", "DOCTOR_ASSISTANT", "ADMIN", "SUPER_ADMIN"),
    listDoctorServicesController,
);

// Only the doctor or admin can manage services
router.post(
    "/:doctorId/services",
    authenticate,
    authorize("DOCTOR", "ADMIN", "SUPER_ADMIN"),
    addDoctorServiceController,
);

router.patch(
    "/:doctorId/services/:serviceId",
    authenticate,
    authorize("DOCTOR", "ADMIN", "SUPER_ADMIN"),
    updateDoctorServiceController,
);

router.delete(
    "/:doctorId/services/:serviceId",
    authenticate,
    authorize("DOCTOR", "ADMIN", "SUPER_ADMIN"),
    deleteDoctorServiceController,
);

export default router;
