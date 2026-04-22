/** @format */

import { z } from "zod";
import { Sex } from "../../generated/prisma/enums";

// ─── Params ───────────────────────────────────────────────────────────────────

export const userIdParamSchema = z.string().cuid("Invalid user ID.");

// ─── Blood Group ──────────────────────────────────────────────────────────────

const BLOOD_GROUPS = [
    "A+",
    "A-",
    "B+",
    "B-",
    "O+",
    "O-",
    "AB+",
    "AB-",
] as const;

// ─── Upsert Patient Profile ───────────────────────────────────────────────────

export const upsertPatientProfileSchema = z
    .object({
        dateOfBirth: z.coerce
            .date()
            .max(new Date(), "Date of birth cannot be in the future.")
            .optional()
            .nullable(),
        sex: z.nativeEnum(Sex).optional().nullable(),
        bloodGroup: z
            .string()
            .trim()
            .toUpperCase()
            .refine(
                (v) =>
                    BLOOD_GROUPS.includes(v as (typeof BLOOD_GROUPS)[number]),
                {
                    message:
                        "Invalid blood group. Must be one of: A+, A-, B+, B-, O+, O-, AB+, AB-",
                },
            )
            .optional()
            .nullable(),
        address: z.string().trim().min(3).max(500).optional().nullable(),
        weightKg: z
            .number()
            .positive("Weight must be a positive number.")
            .max(500, "Weight seems unrealistically high.")
            .optional()
            .nullable(),
        heightCm: z
            .number()
            .positive("Height must be a positive number.")
            .max(300, "Height seems unrealistically high.")
            .optional()
            .nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided.",
    });

export type UpsertPatientProfileInput = z.infer<
    typeof upsertPatientProfileSchema
>;
