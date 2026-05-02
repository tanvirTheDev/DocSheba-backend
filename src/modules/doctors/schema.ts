/** @format */

import { z } from "zod";
import { ServiceType } from "../../generated/prisma/enums";

// ─── Params ───────────────────────────────────────────────────────────────────

export const userIdParamSchema = z.string().cuid("Invalid user ID.");
export const serviceIdParamSchema = z.string().cuid("Invalid service ID.");

// ─── Upsert Doctor Profile ────────────────────────────────────────────────────

export const upsertDoctorProfileSchema = z
    .object({
        specialty: z.string().trim().min(2).max(100).optional(),
        qualifications: z.string().trim().min(2).max(500).optional(),
        licenseNo: z.string().trim().min(2).max(50).optional(),
        clinicName: z.string().trim().min(2).max(200).optional(),
        clinicAddress: z.string().trim().min(5).max(500).optional(),
        followUpFee: z.coerce.number().nonnegative().optional().nullable(),
        isAvailable: z.coerce.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided.",
    });

export type UpsertDoctorProfileInput = z.infer<
    typeof upsertDoctorProfileSchema
>;
// ─── Create Doctor Service ────────────────────────────────────────────────────

export const createDoctorServiceSchema = z.object({
    serviceType: z.nativeEnum(ServiceType),
    fee: z.number().positive("Fee must be a positive number."),
    duration: z
        .number()
        .int()
        .positive("Duration must be a positive integer (minutes)."),
    description: z.string().trim().max(500).optional(),
    isActive: z.boolean().default(true),
});

export type CreateDoctorServiceInput = z.infer<
    typeof createDoctorServiceSchema
>;

// ─── Update Doctor Service ────────────────────────────────────────────────────

export const updateDoctorServiceSchema = z
    .object({
        fee: z.number().positive("Fee must be a positive number.").optional(),
        duration: z
            .number()
            .int()
            .positive("Duration must be a positive integer.")
            .optional(),
        description: z.string().trim().max(500).optional().nullable(),
        isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update.",
    });

export type UpdateDoctorServiceInput = z.infer<
    typeof updateDoctorServiceSchema
>;
