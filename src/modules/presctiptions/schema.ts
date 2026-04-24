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
    .refine((d) => Object.keys(d).length > 0, {
        message: "At least one field must be provided.",
    });

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
export type UpdatePrescriptionInput = z.infer<typeof updatePrescriptionSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// CHIEF COMPLAINTS
// ══════════════════════════════════════════════════════════════════════════════

export const chiefComplaintSchema = z.object({
    complaint: z.string().trim().min(1, "Complaint is required.").max(300),
    duration: z.string().trim().max(50).optional().nullable(),
    durationUnit: z.nativeEnum(DurationUnit).optional().nullable(),
    sortOrder: z.number().int().min(0).default(0),
});

export const updateChiefComplaintSchema = chiefComplaintSchema
    .partial()
    .refine((d) => Object.keys(d).length > 0, {
        message: "At least one field must be provided.",
    });

export type ChiefComplaintInput = z.infer<typeof chiefComplaintSchema>;
export type UpdateChiefComplaintInput = z.infer<
    typeof updateChiefComplaintSchema
>;

// ══════════════════════════════════════════════════════════════════════════════
// HISTORY (one per prescription — upsert)
// ══════════════════════════════════════════════════════════════════════════════

export const historySchema = z.object({
    htn: z.boolean().optional(),
    dm: z.boolean().optional(),
    copd: z.boolean().optional(),
    ihd: z.boolean().optional(),
    ckd: z.boolean().optional(),
    cld: z.boolean().optional(),
    tobaccoChewing: z.boolean().optional(),
    smoking: z.boolean().optional(),
    cvd: z.boolean().optional(),
    asthma: z.boolean().optional(),
    malignancy: z.boolean().optional(),
    allergy: z.boolean().optional(),
    psychiatricDisorder: z.boolean().optional(),
    drugAbuse: z.boolean().optional(),
    depression: z.boolean().optional(),
    otherNotes: z.string().trim().max(1000).optional().nullable(),
});

export type HistoryInput = z.infer<typeof historySchema>;

// ══════════════════════════════════════════════════════════════════════════════
// EXAMINATIONS
// ══════════════════════════════════════════════════════════════════════════════

export const examinationSchema = z.object({
    parameter: z.string().trim().min(1, "Parameter is required.").max(100),
    value: z.string().trim().max(200).optional().nullable(),
    unit: z.string().trim().max(50).optional().nullable(),
    sortOrder: z.number().int().min(0).default(0),
});

export const updateExaminationSchema = examinationSchema
    .partial()
    .refine((d) => Object.keys(d).length > 0, {
        message: "At least one field must be provided.",
    });

export type ExaminationInput = z.infer<typeof examinationSchema>;
export type UpdateExaminationInput = z.infer<typeof updateExaminationSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// DIAGNOSES
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
    .refine((d) => Object.keys(d).length > 0, {
        message: "At least one field must be provided.",
    });

export type DiagnosisInput = z.infer<typeof diagnosisSchema>;
export type UpdateDiagnosisInput = z.infer<typeof updateDiagnosisSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// INVESTIGATIONS
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
    .refine((d) => Object.keys(d).length > 0, {
        message: "At least one field must be provided.",
    });

export type InvestigationInput = z.infer<typeof investigationSchema>;
export type UpdateInvestigationInput = z.infer<
    typeof updateInvestigationSchema
>;

// ══════════════════════════════════════════════════════════════════════════════
// RX ITEMS
// ══════════════════════════════════════════════════════════════════════════════

export const rxItemSchema = z
    .object({
        drugId: z.string().cuid("Invalid drug ID.").optional().nullable(),
        customBrand: z.string().trim().max(200).optional().nullable(),
        itemNo: z
            .number({ required_error: "Item number is required." })
            .int()
            .positive(),
        dose: z.string().trim().max(100).optional().nullable(),
        instruction: z.string().trim().max(300).optional().nullable(),
        duration: z.string().trim().max(100).optional().nullable(),
        sortOrder: z.number().int().min(0).default(0),
    })
    .refine((d) => d.drugId || d.customBrand, {
        message: "Either drugId or customBrand must be provided.",
        path: ["drugId"],
    });

export const updateRxItemSchema = z
    .object({
        drugId: z.string().cuid().optional().nullable(),
        customBrand: z.string().trim().max(200).optional().nullable(),
        itemNo: z.number().int().positive().optional(),
        dose: z.string().trim().max(100).optional().nullable(),
        instruction: z.string().trim().max(300).optional().nullable(),
        duration: z.string().trim().max(100).optional().nullable(),
        sortOrder: z.number().int().min(0).optional(),
    })
    .refine((d) => Object.keys(d).length > 0, {
        message: "At least one field must be provided.",
    });

export type RxItemInput = z.infer<typeof rxItemSchema>;
export type UpdateRxItemInput = z.infer<typeof updateRxItemSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// PRESCRIPTION ADVICE
// ══════════════════════════════════════════════════════════════════════════════

export const adviceSchema = z.object({
    adviceText: z.string().trim().max(1000).optional().nullable(),
    nextVisitDate: z.string().trim().max(100).optional().nullable(),
    fee: z.number().positive().optional().nullable(),
    visitNo: z.number().int().positive().optional().nullable(),
    doctorContact: z.string().trim().max(20).optional().nullable(),
    emergencyContact: z.string().trim().max(20).optional().nullable(),
    sortOrder: z.number().int().min(0).default(0),
});

export const updateAdviceSchema = adviceSchema
    .partial()
    .refine((d) => Object.keys(d).length > 0, {
        message: "At least one field must be provided.",
    });

export type AdviceInput = z.infer<typeof adviceSchema>;
export type UpdateAdviceInput = z.infer<typeof updateAdviceSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// REPORT ENTRIES
// ══════════════════════════════════════════════════════════════════════════════

export const reportEntrySchema = z.object({
    reportName: z.string().trim().min(1, "Report name is required.").max(200),
    reportDate: z.coerce.date().optional().nullable(),
    resultValue: z.string().trim().max(200).optional().nullable(),
    unit: z.string().trim().max(50).optional().nullable(),
});

export const updateReportEntrySchema = reportEntrySchema
    .partial()
    .refine((d) => Object.keys(d).length > 0, {
        message: "At least one field must be provided.",
    });

export type ReportEntryInput = z.infer<typeof reportEntrySchema>;
export type UpdateReportEntryInput = z.infer<typeof updateReportEntrySchema>;

// ══════════════════════════════════════════════════════════════════════════════
// BMI RECORD (one per prescription — upsert)
// ══════════════════════════════════════════════════════════════════════════════

export const bmiRecordSchema = z.object({
    weightKg: z.number().positive().max(500).optional().nullable(),
    heightFeet: z.number().min(0).max(10).optional().nullable(),
    heightInches: z.number().min(0).max(11).optional().nullable(),
    insulin: z.number().optional().nullable(),
    qScore: z.number().optional().nullable(),
    wwi: z.number().optional().nullable(),
    bild: z.number().optional().nullable(),
});

export type BmiRecordInput = z.infer<typeof bmiRecordSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// DRUG HISTORY
// ══════════════════════════════════════════════════════════════════════════════

export const drugHistorySchema = z.object({
    drugName: z.string().trim().min(1, "Drug name is required.").max(200),
    details: z.string().trim().max(500).optional().nullable(),
    sortOrder: z.number().int().min(0).default(0),
});

export const updateDrugHistorySchema = drugHistorySchema
    .partial()
    .refine((d) => Object.keys(d).length > 0, {
        message: "At least one field must be provided.",
    });

export type DrugHistoryInput = z.infer<typeof drugHistorySchema>;
export type UpdateDrugHistoryInput = z.infer<typeof updateDrugHistorySchema>;

// ══════════════════════════════════════════════════════════════════════════════
// PLANS
// ══════════════════════════════════════════════════════════════════════════════

export const planSchema = z.object({
    planText: z.string().trim().min(1, "Plan text is required.").max(500),
    sortOrder: z.number().int().min(0).default(0),
});

export const updatePlanSchema = planSchema
    .partial()
    .refine((d) => Object.keys(d).length > 0, {
        message: "At least one field must be provided.",
    });

export type PlanInput = z.infer<typeof planSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// NOTES
// ══════════════════════════════════════════════════════════════════════════════

export const noteSchema = z.object({
    noteText: z.string().trim().min(1, "Note text is required.").max(500),
    sortOrder: z.number().int().min(0).default(0),
});

export const updateNoteSchema = noteSchema
    .partial()
    .refine((d) => Object.keys(d).length > 0, {
        message: "At least one field must be provided.",
    });

export type NoteInput = z.infer<typeof noteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
