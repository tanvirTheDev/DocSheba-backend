/** @format */

import { Router } from "express";

import {
    createAdviceTemplate,
    deleteAdviceTemplate,
    getAdviceTemplate,
    listAdviceTemplates,
    updateAdviceTemplate,
    createDrugTemplate,
    deleteDrugTemplate,
    getDrugTemplate,
    listDrugTemplates,
    updateDrugTemplate,
    createTreatmentTemplate,
    deleteTreatmentTemplate,
    getTreatmentTemplate,
    listTreatmentTemplates,
    updateTreatmentTemplate,
    createPrescriptionTemplate,
    deletePrescriptionTemplate,
    getPrescriptionTemplate,
    listPrescriptionTemplates,
    updatePrescriptionTemplate,
} from "./controllers";

import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

const router = Router();

// All template routes require authentication.
// Doctors, Admins, and Doctor Assistants can read/write templates.
// Patients cannot access templates.
router.use(authenticate);
router.use(authorize("DOCTOR", "DOCTOR_ASSISTANT", "ADMIN", "SUPER_ADMIN"));

// ─────────────────────────────────────────────────────────────
// ADVICE TEMPLATES   /templates/advice
// ─────────────────────────────────────────────────────────────

router.get("/advice", listAdviceTemplates);
router.post("/advice", createAdviceTemplate);

router
    .route("/advice/:id")
    .get(getAdviceTemplate)
    .patch(updateAdviceTemplate)
    .delete(deleteAdviceTemplate);

// ─────────────────────────────────────────────────────────────
// DRUG TEMPLATES   /templates/drugs
// ─────────────────────────────────────────────────────────────

router.route("/drugs").get(listDrugTemplates).post(createDrugTemplate);

router
    .route("/drugs/:id")
    .get(getDrugTemplate)
    .patch(updateDrugTemplate)
    .delete(deleteDrugTemplate);

// ─────────────────────────────────────────────────────────────
// TREATMENT TEMPLATES   /templates/treatments
// ─────────────────────────────────────────────────────────────

router
    .route("/treatments")
    .get(listTreatmentTemplates)
    .post(createTreatmentTemplate);

router
    .route("/treatments/:id")
    .get(getTreatmentTemplate)
    .patch(updateTreatmentTemplate)
    .delete(deleteTreatmentTemplate);

// ─────────────────────────────────────────────────────────────
// PRESCRIPTION TEMPLATES   /templates/prescriptions
// ─────────────────────────────────────────────────────────────

router
    .route("/prescriptions")
    .get(listPrescriptionTemplates)
    .post(createPrescriptionTemplate);

router
    .route("/prescriptions/:id")
    .get(getPrescriptionTemplate)
    .patch(updatePrescriptionTemplate)
    .delete(deletePrescriptionTemplate);

export default router;
