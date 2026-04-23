/** @format */

import { z } from "zod";
import { PrescriptionStatus, DurationUnit } from "../../generated/prisma/enums";

// ─── Params ───────────────────────────────────────────────────────────────────

export const prescriptionIdSchema = z.string().cuid("Invalid prescription ID.");
export const itemIdSchema = z.string().cuid("Invalid item ID.");

// ══════════════════════════════════════════════════════════════════════════════
// PRESCRIPTION ROOT
// ══════════════════════════════════════════════════════════════════════════════

export const createPrescriptionSchema = z.object({
    appointmentId: z.string().cuid("Invalid appointment ID."),
    headerTemplate: z.string().trim().max(500).optional().nullable(),
    clinicalNotes: z.string().trim().max(2000).optional().nullable(),
});

export const updatePrescriptionSchema = z
    .object({
        status: z.nativeEnum(PrescriptionStatus).optional(),
        headerTemplate: z.string().trim().max(500).optional().nullable(),
        clinicalNotes: z.string().trim().max(2000).optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided.",
    });

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
export type UpdatePrescriptionInput = z.infer<typeof updatePrescriptionSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// CHIEF COMPLAINT
// ══════════════════════════════════════════════════════════════════════════════

export const chiefComplaintSchema = z.object({
    complaint: z.string().trim().min(1, "Complaint is required.").max(300),
    duration: z.string().trim().max(20).optional().nullable(),
    durationUnit: z.nativeEnum(DurationUnit).optional().nullable(),
    sortOrder: z.number().int().min(0).default(0),
});

export const updateChiefComplaintSchema = chiefComplaintSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided.",
    });

export type ChiefComplaintInput = z.infer<typeof chiefComplaintSchema>;
export type UpdateChiefComplaintInput = z.infer<
    typeof updateChiefComplaintSchema
>;

// ══════════════════════════════════════════════════════════════════════════════
// HISTORY (upsert — all boolean flags)
// ══════════════════════════════════════════════════════════════════════════════

export const historySchema = z.object({
    htn: z.boolean().default(false),
    dm: z.boolean().default(false),
    copd: z.boolean().default(false),
    ihd: z.boolean().default(false),
    ckd: z.boolean().default(false),
    cld: z.boolean().default(false),
    tobaccoChewing: z.boolean().default(false),
    smoking: z.boolean().default(false),
    cvd: z.boolean().default(false),
    asthma: z.boolean().default(false),
    malignancy: z.boolean().default(false),
    allergy: z.boolean().default(false),
    psychiatricDisorder: z.boolean().default(false),
    drugAbuse: z.boolean().default(false),
    depression: z.boolean().default(false),
    otherNotes: z.string().trim().max(1000).optional().nullable(),
});

export type HistoryInput = z.infer<typeof historySchema>;

// ══════════════════════════════════════════════════════════════════════════════
// EXAMINATION
// ══════════════════════════════════════════════════════════════════════════════

export const examinationSchema = z.object({
    parameter: z.string().trim().min(1, "Parameter name is required.").max(100),
    value: z.string().trim().max(200).optional().nullable(),
    unit: z.string().trim().max(50).optional().nullable(),
    sortOrder: z.number().int().min(0).default(0),
});

export const updateExaminationSchema = examinationSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided.",
    });

export type ExaminationInput = z.infer<typeof examinationSchema>;
export type UpdateExaminationInput = z.infer<typeof updateExaminationSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// DIAGNOSIS
// ══════════════════════════════════════════════════════════════════════════════

export const diagnosisSchema = z.object({
    diagnosisText: z
        .string()
        .trim()
        .min(1, "Diagnosis text is required.")
        .max(500),
    sortOrder: z.number().int().min(0).default(0),
});

export const updateDiagnosisSchema = diagnosisSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided.",
    });

export type DiagnosisInput = z.infer<typeof diagnosisSchema>;
export type UpdateDiagnosisInput = z.infer<typeof updateDiagnosisSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// INVESTIGATION
// ══════════════════════════════════════════════════════════════════════════════

export const investigationSchema = z.object({
    investigationName: z
        .string()
        .trim()
        .min(1, "Investigation name is required.")
        .max(200),
    sortOrder: z.number().int().min(0).default(0),
});

export const updateInvestigationSchema = investigationSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided.",
    });

export type InvestigationInput = z.infer<typeof investigationSchema>;
export type UpdateInvestigationInput = z.infer<
    typeof updateInvestigationSchema
>;

// ══════════════════════════════════════════════════════════════════════════════
// RX ITEM
// ══════════════════════════════════════════════════════════════════════════════

export const rxItemSchema = z
    .object({
        drugId: z.string().cuid("Invalid drug ID.").optional().nullable(),
        itemNo: z
            .number({ required_error: "Item number is required." })
            .int()
            .positive(),
        customBrand: z.string().trim().max(200).optional().nullable(),
        dose: z.string().trim().max(100).optional().nullable(),
        instruction: z.string().trim().max(300).optional().nullable(),
        duration: z.string().trim().max(100).optional().nullable(),
        sortOrder: z.number().int().min(0).default(0),
    })
    .refine((data) => data.drugId || data.customBrand, {
        message: "Either drugId or customBrand must be provided.",
        path: ["drugId"],
    });

export const updateRxItemSchema = z
    .object({
        drugId: z.string().cuid("Invalid drug ID.").optional().nullable(),
        itemNo: z.number().int().positive().optional(),
        customBrand: z.string().trim().max(200).optional().nullable(),
        dose: z.string().trim().max(100).optional().nullable(),
        instruction: z.string().trim().max(300).optional().nullable(),
        duration: z.string().trim().max(100).optional().nullable(),
        sortOrder: z.number().int().min(0).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided.",
    });

export type RxItemInput = z.infer<typeof rxItemSchema>;
export type UpdateRxItemInput = z.infer<typeof updateRxItemSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// PRESCRIPTION ADVICE
// ══════════════════════════════════════════════════════════════════════════════

export const prescriptionAdviceSchema = z.object({
    adviceText: z.string().trim().max(1000).optional().nullable(),
    nextVisitDate: z.string().trim().max(100).optional().nullable(),
    fee: z.number().positive().optional().nullable(),
    visitNo: z.number().int().positive().optional().nullable(),
    doctorContact: z.string().trim().max(20).optional().nullable(),
    emergencyContact: z.string().trim().max(20).optional().nullable(),
    sortOrder: z.number().int().min(0).default(0),
});

export const updatePrescriptionAdviceSchema = prescriptionAdviceSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided.",
    });

export type PrescriptionAdviceInput = z.infer<typeof prescriptionAdviceSchema>;
export type UpdatePrescriptionAdviceInput = z.infer<
    typeof updatePrescriptionAdviceSchema
>;
