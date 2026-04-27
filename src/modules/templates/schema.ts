/** @format */

import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// ADVICE TEMPLATE SCHEMAS
// ─────────────────────────────────────────────────────────────

export const createAdviceTemplateSchema = z.object({
    body: z.object({
        templateName: z
            .string({ required_error: "Template name is required" })
            .min(1, "Template name cannot be empty")
            .max(100, "Template name must be at most 100 characters"),
        adviceText: z
            .string({ required_error: "Advice text is required" })
            .min(1, "Advice text cannot be empty"),
        isShared: z.boolean().default(false),
    }),
});

export const updateAdviceTemplateSchema = z.object({
    params: z.object({
        id: z.string({ required_error: "Template ID is required" }),
    }),
    body: z.object({
        templateName: z.string().min(1).max(100).optional(),
        adviceText: z.string().min(1).optional(),
        isShared: z.boolean().optional(),
    }),
});

// ─────────────────────────────────────────────────────────────
// DRUG TEMPLATE SCHEMAS
// ─────────────────────────────────────────────────────────────

export const drugTemplateItemSchema = z.object({
    drugId: z.string().optional(),
    customBrand: z.string().optional(),
    dose: z.string().optional(),
    instruction: z.string().optional(),
    duration: z.string().optional(),
    sortOrder: z.number().int().default(0),
});

export const createDrugTemplateSchema = z.object({
    body: z
        .object({
            templateName: z
                .string({ required_error: "Template name is required" })
                .min(1)
                .max(100),
            isShared: z.boolean().default(false),
            items: z
                .array(drugTemplateItemSchema)
                .min(1, "At least one drug item is required"),
        })
        .refine(
            (data) =>
                data.items.every((item) => item.drugId || item.customBrand),
            {
                message:
                    "Each drug item must have either a drugId or a customBrand",
                path: ["items"],
            },
        ),
});

export const updateDrugTemplateSchema = z.object({
    params: z.object({
        id: z.string({ required_error: "Template ID is required" }),
    }),
    body: z
        .object({
            templateName: z.string().min(1).max(100).optional(),
            isShared: z.boolean().optional(),
            items: z.array(drugTemplateItemSchema).min(1).optional(),
        })
        .refine(
            (data) =>
                !data.items ||
                data.items.every((item) => item.drugId || item.customBrand),
            {
                message:
                    "Each drug item must have either a drugId or a customBrand",
                path: ["items"],
            },
        ),
});

// ─────────────────────────────────────────────────────────────
// TREATMENT TEMPLATE SCHEMAS
// ─────────────────────────────────────────────────────────────

export const createTreatmentTemplateSchema = z.object({
    body: z.object({
        templateName: z
            .string({ required_error: "Template name is required" })
            .min(1)
            .max(100),
        treatmentNotes: z
            .string({ required_error: "Treatment notes are required" })
            .min(1),
        isShared: z.boolean().default(false),
    }),
});

export const updateTreatmentTemplateSchema = z.object({
    params: z.object({
        id: z.string({ required_error: "Template ID is required" }),
    }),
    body: z.object({
        templateName: z.string().min(1).max(100).optional(),
        treatmentNotes: z.string().min(1).optional(),
        isShared: z.boolean().optional(),
    }),
});

// ─────────────────────────────────────────────────────────────
// PRESCRIPTION TEMPLATE SCHEMAS
// ─────────────────────────────────────────────────────────────

export const prescriptionTemplateItemSchema = z.object({
    drugId: z.string().optional(),
    diagnosisText: z.string().optional(),
    adviceText: z.string().optional(),
    customBrand: z.string().optional(),
    dose: z.string().optional(),
    instruction: z.string().optional(),
    duration: z.string().optional(),
    sortOrder: z.number().int().default(0),
});

export const createPrescriptionTemplateSchema = z.object({
    body: z.object({
        templateName: z
            .string({ required_error: "Template name is required" })
            .min(1)
            .max(100),
        isShared: z.boolean().default(false),
        items: z.array(prescriptionTemplateItemSchema).optional().default([]),
    }),
});

export const updatePrescriptionTemplateSchema = z.object({
    params: z.object({
        id: z.string({ required_error: "Template ID is required" }),
    }),
    body: z.object({
        templateName: z.string().min(1).max(100).optional(),
        isShared: z.boolean().optional(),
    }),
});

// ─────────────────────────────────────────────────────────────
// SHARED ID PARAM SCHEMA
// ─────────────────────────────────────────────────────────────

export const templateIdParamSchema = z.object({
    params: z.object({
        id: z.string({ required_error: "Template ID is required" }),
    }),
});

// ─────────────────────────────────────────────────────────────
// INFERRED TYPES
// ─────────────────────────────────────────────────────────────

export type CreateAdviceTemplateInput = z.infer<
    typeof createAdviceTemplateSchema
>["body"];

export type UpdateAdviceTemplateInput = z.infer<
    typeof updateAdviceTemplateSchema
>["body"];

export type CreateDrugTemplateInput = z.infer<
    typeof createDrugTemplateSchema
>["body"];

export type UpdateDrugTemplateInput = z.infer<
    typeof updateDrugTemplateSchema
>["body"];

export type CreateTreatmentTemplateInput = z.infer<
    typeof createTreatmentTemplateSchema
>["body"];

export type UpdateTreatmentTemplateInput = z.infer<
    typeof updateTreatmentTemplateSchema
>["body"];

export type CreatePrescriptionTemplateInput = z.infer<
    typeof createPrescriptionTemplateSchema
>["body"];

export type UpdatePrescriptionTemplateInput = z.infer<
    typeof updatePrescriptionTemplateSchema
>["body"];

export type DrugTemplateItemInput = z.infer<typeof drugTemplateItemSchema>;

export type PrescriptionTemplateItemInput = z.infer<
    typeof prescriptionTemplateItemSchema
>;
