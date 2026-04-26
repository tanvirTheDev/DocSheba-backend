/** @format */
/** @format */

import { Router } from "express";
import {
    createPrescriptionController,
    getPrescriptionByIdController,
    updatePrescriptionController,
    printPrescriptionController,
    chiefComplaintControllers,
    getHistoryController,
    upsertHistoryController,
    examinationControllers,
    diagnosisControllers,
    investigationControllers,
    rxItemControllers,
    adviceControllers,
    reportEntryControllers,
    getBmiRecordController,
    upsertBmiRecordController,
    drugHistoryControllers,
    planControllers,
    noteControllers,
} from "./controllers";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

const router = Router();

router.use(authenticate);

// ─── Roles ────────────────────────────────────────────────────────────────────
// DOCTOR / DOCTOR_ASSISTANT → create, read, write all sections
// PATIENT                   → read only (their own prescriptions)
// ADMIN / SUPER_ADMIN        → full access

const READERS = [
    "PATIENT",
    "DOCTOR",
    "DOCTOR_ASSISTANT",
    "ADMIN",
    "SUPER_ADMIN",
] as const;
const WRITERS = ["DOCTOR", "DOCTOR_ASSISTANT", "ADMIN", "SUPER_ADMIN"] as const;

// ══════════════════════════════════════════════════════════════════════════════
// PRESCRIPTION ROOT
// ══════════════════════════════════════════════════════════════════════════════

/**
 * POST /prescriptions
 * Initialise a DRAFT prescription for a completed appointment.
 * One prescription per appointment enforced in service layer.
 */
router.post("/", authorize(...WRITERS), createPrescriptionController);

/**
 * GET /prescriptions/:id
 * Returns full prescription with all clinical sub-sections.
 * Patients can only read their own.
 */
router.get("/:id", authorize(...READERS), getPrescriptionByIdController);

/**
 * PATCH /prescriptions/:id
 * Update metadata (headerTemplate, clinicalNotes) or promote status.
 * Blocked once prescription is FINALIZED or PRINTED.
 */
router.patch("/:id", authorize(...WRITERS), updatePrescriptionController);

/**
 * POST /prescriptions/:id/print
 * Mark prescription as PRINTED and return print-ready data.
 * Prescription must be FINALIZED first.
 */
router.post("/:id/print", authorize(...WRITERS), printPrescriptionController);

// ══════════════════════════════════════════════════════════════════════════════
// CHIEF COMPLAINTS
// ══════════════════════════════════════════════════════════════════════════════

router.get(
    "/:prescriptionId/chief-complaints",
    authorize(...READERS),
    chiefComplaintControllers.list,
);

router.post(
    "/:prescriptionId/chief-complaints",
    authorize(...WRITERS),
    chiefComplaintControllers.add,
);

router.patch(
    "/:prescriptionId/chief-complaints/:id",
    authorize(...WRITERS),
    chiefComplaintControllers.update,
);

router.delete(
    "/:prescriptionId/chief-complaints/:id",
    authorize(...WRITERS),
    chiefComplaintControllers.delete,
);

// ══════════════════════════════════════════════════════════════════════════════
// HISTORY  (one per prescription — upsert)
// ══════════════════════════════════════════════════════════════════════════════

router.get(
    "/:prescriptionId/history",
    authorize(...READERS),
    getHistoryController,
);

router.put(
    "/:prescriptionId/history",
    authorize(...WRITERS),
    upsertHistoryController,
);

// ══════════════════════════════════════════════════════════════════════════════
// EXAMINATIONS
// ══════════════════════════════════════════════════════════════════════════════

router.get(
    "/:prescriptionId/examinations",
    authorize(...READERS),
    examinationControllers.list,
);

router.post(
    "/:prescriptionId/examinations",
    authorize(...WRITERS),
    examinationControllers.add,
);

router.patch(
    "/:prescriptionId/examinations/:id",
    authorize(...WRITERS),
    examinationControllers.update,
);

router.delete(
    "/:prescriptionId/examinations/:id",
    authorize(...WRITERS),
    examinationControllers.delete,
);

// ══════════════════════════════════════════════════════════════════════════════
// DIAGNOSES
// ══════════════════════════════════════════════════════════════════════════════

router.get(
    "/:prescriptionId/diagnoses",
    authorize(...READERS),
    diagnosisControllers.list,
);

router.post(
    "/:prescriptionId/diagnoses",
    authorize(...WRITERS),
    diagnosisControllers.add,
);

router.patch(
    "/:prescriptionId/diagnoses/:id",
    authorize(...WRITERS),
    diagnosisControllers.update,
);

router.delete(
    "/:prescriptionId/diagnoses/:id",
    authorize(...WRITERS),
    diagnosisControllers.delete,
);

// ══════════════════════════════════════════════════════════════════════════════
// INVESTIGATIONS
// ══════════════════════════════════════════════════════════════════════════════

router.get(
    "/:prescriptionId/investigations",
    authorize(...READERS),
    investigationControllers.list,
);

router.post(
    "/:prescriptionId/investigations",
    authorize(...WRITERS),
    investigationControllers.add,
);

router.patch(
    "/:prescriptionId/investigations/:id",
    authorize(...WRITERS),
    investigationControllers.update,
);

router.delete(
    "/:prescriptionId/investigations/:id",
    authorize(...WRITERS),
    investigationControllers.delete,
);

// ══════════════════════════════════════════════════════════════════════════════
// RX ITEMS  (drug list)
// ══════════════════════════════════════════════════════════════════════════════

router.get(
    "/:prescriptionId/rx",
    authorize(...READERS),
    rxItemControllers.list,
);

router.post(
    "/:prescriptionId/rx",
    authorize(...WRITERS),
    rxItemControllers.add,
);

router.patch(
    "/:prescriptionId/rx/:id",
    authorize(...WRITERS),
    rxItemControllers.update,
);

router.delete(
    "/:prescriptionId/rx/:id",
    authorize(...WRITERS),
    rxItemControllers.delete,
);

// ══════════════════════════════════════════════════════════════════════════════
// ADVICE
// ══════════════════════════════════════════════════════════════════════════════

router.get(
    "/:prescriptionId/advice",
    authorize(...READERS),
    adviceControllers.list,
);

router.post(
    "/:prescriptionId/advice",
    authorize(...WRITERS),
    adviceControllers.add,
);

router.patch(
    "/:prescriptionId/advice/:id",
    authorize(...WRITERS),
    adviceControllers.update,
);

router.delete(
    "/:prescriptionId/advice/:id",
    authorize(...WRITERS),
    adviceControllers.delete,
);

// ══════════════════════════════════════════════════════════════════════════════
// REPORT ENTRIES
// ══════════════════════════════════════════════════════════════════════════════

router.get(
    "/:prescriptionId/reports",
    authorize(...READERS),
    reportEntryControllers.list,
);

router.post(
    "/:prescriptionId/reports",
    authorize(...WRITERS),
    reportEntryControllers.add,
);

router.patch(
    "/:prescriptionId/reports/:id",
    authorize(...WRITERS),
    reportEntryControllers.update,
);

router.delete(
    "/:prescriptionId/reports/:id",
    authorize(...WRITERS),
    reportEntryControllers.delete,
);

// ══════════════════════════════════════════════════════════════════════════════
// BMI RECORD  (one per prescription — upsert)
// ══════════════════════════════════════════════════════════════════════════════

router.get(
    "/:prescriptionId/bmi",
    authorize(...READERS),
    getBmiRecordController,
);

router.put(
    "/:prescriptionId/bmi",
    authorize(...WRITERS),
    upsertBmiRecordController,
);

// ══════════════════════════════════════════════════════════════════════════════
// DRUG HISTORY
// ══════════════════════════════════════════════════════════════════════════════

router.get(
    "/:prescriptionId/drug-history",
    authorize(...READERS),
    drugHistoryControllers.list,
);

router.post(
    "/:prescriptionId/drug-history",
    authorize(...WRITERS),
    drugHistoryControllers.add,
);

router.patch(
    "/:prescriptionId/drug-history/:id",
    authorize(...WRITERS),
    drugHistoryControllers.update,
);

router.delete(
    "/:prescriptionId/drug-history/:id",
    authorize(...WRITERS),
    drugHistoryControllers.delete,
);

// ══════════════════════════════════════════════════════════════════════════════
// PLANS
// ══════════════════════════════════════════════════════════════════════════════

router.get(
    "/:prescriptionId/plans",
    authorize(...READERS),
    planControllers.list,
);

router.post(
    "/:prescriptionId/plans",
    authorize(...WRITERS),
    planControllers.add,
);

router.patch(
    "/:prescriptionId/plans/:id",
    authorize(...WRITERS),
    planControllers.update,
);

router.delete(
    "/:prescriptionId/plans/:id",
    authorize(...WRITERS),
    planControllers.delete,
);

// ══════════════════════════════════════════════════════════════════════════════
// NOTES
// ══════════════════════════════════════════════════════════════════════════════

router.get(
    "/:prescriptionId/notes",
    authorize(...READERS),
    noteControllers.list,
);

router.post(
    "/:prescriptionId/notes",
    authorize(...WRITERS),
    noteControllers.add,
);

router.patch(
    "/:prescriptionId/notes/:id",
    authorize(...WRITERS),
    noteControllers.update,
);

router.delete(
    "/:prescriptionId/notes/:id",
    authorize(...WRITERS),
    noteControllers.delete,
);

export default router;
