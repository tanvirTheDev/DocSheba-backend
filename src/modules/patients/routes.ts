/** @format */

import { Router } from "express";
import {
    getPatientProfileController,
    upsertPatientProfileController,
} from "./controllers";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

const router = Router();

router.use(authenticate);

// ─── Patient Profile ──────────────────────────────────────────────────────────

// Patients can view their own; doctors/admins can view any
router.get(
    "/:userId/profile",
    authorize("PATIENT", "DOCTOR", "DOCTOR_ASSISTANT", "ADMIN", "SUPER_ADMIN"),
    getPatientProfileController,
);

// Patients can upsert their own; admins can upsert any
router.put(
    "/:userId/profile",
    authorize("PATIENT", "ADMIN", "SUPER_ADMIN"),
    upsertPatientProfileController,
);

export default router;
