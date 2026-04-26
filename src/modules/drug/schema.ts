/** @format */

import { z } from "zod";
import { DrugForm } from "../../generated/prisma/enums";

// ─── Params ───────────────────────────────────────────────────────────────────

export const drugIdSchema = z.string().cuid("Invalid drug ID.");
export const templateIdSchema = z.string().cuid("Invalid template ID.");

// ══════════════════════════════════════════════════════════════════════════════
// DRUG CATALOGUE
// ══════════════════════════════════════════════════════════════════════════════

export const searchDrugsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().optional(),
    form: z.nativeEnum(DrugForm).optional(),
});

export type SearchDrugsInput = z.infer<typeof searchDrugsSchema>;

export const createDrugSchema = z.object({
    brandName: z.string().trim().min(1, "Brand name is required.").max(200),
    genericName: z.string().trim().max(200).optional().nullable(),
    drugClass: z.string().trim().max(200).optional().nullable(),
    strength: z.string().trim().max(100).optional().nullable(),
    form: z.nativeEnum(DrugForm).optional().nullable(),
    isActive: z.boolean().default(true),
});

export type CreateDrugInput = z.infer<typeof createDrugSchema>;

export const updateDrugSchema = createDrugSchema
    .partial()
    .refine((d) => Object.keys(d).length > 0, {
        message: "At least one field must be provided.",
    });

export type UpdateDrugInput = z.infer<typeof updateDrugSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// DRUG TEMPLATE
// ══════════════════════════════════════════════════════════════════════════════

export const drugTemplateItemSchema = z
    .object({
        drugId: z.string().cuid("Invalid drug ID.").optional().nullable(),
        customBrand: z.string().trim().max(200).optional().nullable(),
        dose: z.string().trim().max(100).optional().nullable(),
        instruction: z.string().trim().max(300).optional().nullable(),
        duration: z.string().trim().max(100).optional().nullable(),
        sortOrder: z.number().int().min(0).default(0),
    })
    .refine((d) => d.drugId || d.customBrand, {
        message: "Either drugId or customBrand must be provided.",
        path: ["drugId"],
    });

export const createDrugTemplateSchema = z.object({
    templateName: z
        .string()
        .trim()
        .min(1, "Template name is required.")
        .max(200),
    isShared: z.boolean().default(false),
    items: z
        .array(drugTemplateItemSchema)
        .min(1, "At least one drug item is required."),
});

export type CreateDrugTemplateInput = z.infer<typeof createDrugTemplateSchema>;

export const updateDrugTemplateSchema = z
    .object({
        templateName: z.string().trim().min(1).max(200).optional(),
        isShared: z.boolean().optional(),
        items: z.array(drugTemplateItemSchema).min(1).optional(),
    })
    .refine((d) => Object.keys(d).length > 0, {
        message: "At least one field must be provided.",
    });

export type UpdateDrugTemplateInput = z.infer<typeof updateDrugTemplateSchema>;
