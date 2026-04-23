/** @format */

import { z } from "zod";
import { ServiceType } from "../../generated/prisma/enums";

// ─── Params ───────────────────────────────────────────────────────────────────

export const userIdParamSchema = z.string().cuid("Invalid user ID.");
export const doctorIdParamSchema = z.string().cuid("Invalid doctor ID.");
export const serviceIdParamSchema = z.string().cuid("Invalid service ID.");

// ─── Upsert Doctor Profile ────────────────────────────────────────────────────

export const upsertDoctorProfileSchema = z
    .object({
        specialty: z
            .string()
            .trim()
            .min(2, "Specialty must be at least 2 characters.")
            .max(100)
            .optional()
            .nullable(),
        qualifications: z
            .string()
            .trim()
            .min(2, "Qualifications must be at least 2 characters.")
            .max(500)
            .optional()
            .nullable(),
        licenseNo: z
            .string()
            .trim()
            .min(2, "License number must be at least 2 characters.")
            .max(50)
            .optional()
            .nullable(),
        signatureImageUrl: z
            .string()
            .url("Invalid signature image URL.")
            .optional()
            .nullable(),
        clinicName: z
            .string()
            .trim()
            .min(2, "Clinic name must be at least 2 characters.")
            .max(200)
            .optional()
            .nullable(),
        clinicAddress: z
            .string()
            .trim()
            .min(5, "Clinic address must be at least 5 characters.")
            .max(500)
            .optional()
            .nullable(),
        isAvailable: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided.",
    });

export type UpsertDoctorProfileInput = z.infer<
    typeof upsertDoctorProfileSchema
>;

// ─── Create Doctor Service ────────────────────────────────────────────────────

export const createDoctorServiceSchema = z.object({
    serviceType: z.nativeEnum(ServiceType, {
        errorMap: () => ({ message: "Invalid service type." }),
    }),
    fee: z
        .number({ required_error: "Fee is required." })
        .positive("Fee must be a positive number."),
    duration: z
        .number({ required_error: "Duration is required." })
        .int("Duration must be a whole number.")
        .positive("Duration must be a positive integer (minutes).")
        .max(480, "Duration cannot exceed 480 minutes (8 hours)."),
    description: z.string().trim().max(500).optional().nullable(),
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
            .int("Duration must be a whole number.")
            .positive("Duration must be a positive integer.")
            .max(480, "Duration cannot exceed 480 minutes.")
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
