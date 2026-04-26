/** @format */

import { Router } from "express";
import {
    searchDrugsController,
    getDrugByIdController,
    createDrugController,
    updateDrugController,
    deactivateDrugController,
    listDrugTemplatesController,
    createDrugTemplateController,
    updateDrugTemplateController,
    deleteDrugTemplateController,
} from "./controllers";
import { authenticate } from "../../middleware/authenticate";
import { authorize }    from "../../middleware/authorize";

const router = Router();

// ══════════════════════════════════════════════════════════════════════════════
// DRUG CATALOGUE
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /drugs
 * Public-ish search for Rx autocomplete.
 * All authenticated users (doctor, assistant, patient, admin) can search.
 * Only returns isActive: true drugs.
 */
router.get(
    "/",
    authenticate,
    authorize("PATIENT", "DOCTOR", "DOCTOR_ASSISTANT", "ADMIN", "SUPER_ADMIN"),
    searchDrugsController,
);

/**
 * POST /drugs
 * Add a new drug to the master catalogue.
 * Admin / Super Admin only.
 */
router.post(
    "/",
    authenticate,
    authorize("ADMIN", "SUPER_ADMIN"),
    createDrugController,
);

/**
 * GET /drugs/:id
 * Get a single drug entry by ID.
 */
router.get(
    "/:id",
    authenticate,
    authorize("PATIENT", "DOCTOR", "DOCTOR_ASSISTANT", "ADMIN", "SUPER_ADMIN"),
    getDrugByIdController,
);

/**
 * PATCH /drugs/:id
 * Update drug details (brandName, strength, form, etc.).
 * Admin / Super Admin only.
 */
router.patch(
    "/:id",
    authenticate,
    authorize("ADMIN", "SUPER_ADMIN"),
    updateDrugController,
);

/**
 * DELETE /drugs/:id
 * Soft delete — sets isActive: false.
 * Drug remains in DB so existing Rx items keep their reference.
 * Admin / Super Admin only.
 */
router.delete(
    "/:id",
    authenticate,
    authorize("ADMIN", "SUPER_ADMIN"),
    deactivateDrugController,
);

// ══════════════════════════════════════════════════════════════════════════════
// DRUG TEMPLATES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /drugs/templates
 * Returns doctor's own templates + shared templates.
 * Admins see all templates.
 */
router.get(
    "/templates",
    authenticate,
    authorize("DOCTOR", "DOCTOR_ASSISTANT", "ADMIN", "SUPER_ADMIN"),
    listDrugTemplatesController,
);

/**
 * POST /drugs/templates
 * Create a named drug regimen template.
 * Doctor / Admin only.
 */
router.post(
    "/templates",
    authenticate,
    authorize("DOCTOR", "ADMIN", "SUPER_ADMIN"),
    createDrugTemplateController,
);

/**
 * PATCH /drugs/templates/:id
 * Update template metadata or replace all items.
 * Owner or admin only — enforced in service.
 */
router.patch(
    "/templates/:id",
    authenticate,
    authorize("DOCTOR", "ADMIN", "SUPER_ADMIN"),
    updateDrugTemplateController,
);

/**
 * DELETE /drugs/templates/:id
 * Hard delete — owner or admin only.
 */
router.delete(
    "/templates/:id",
    authenticate,
    authorize("DOCTOR", "ADMIN", "SUPER_ADMIN"),
    deleteDrugTemplateController,
);

export default router;