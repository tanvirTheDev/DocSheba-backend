/** @format */

import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────

export const PlanTierEnum = z.enum([
    "FREE",
    "BASIC",
    "PROFESSIONAL",
    "ENTERPRISE",
]);

export const SubscriptionStatusEnum = z.enum([
    "TRIAL",
    "ACTIVE",
    "PAST_DUE",
    "CANCELLED",
    "EXPIRED",
]);

export const BillingCycleEnum = z.enum(["MONTHLY", "YEARLY"]);

export const PaymentStatusEnum = z.enum([
    "PENDING",
    "PAID",
    "FAILED",
    "REFUNDED",
]);

export const PaymentMethodEnum = z.enum([
    "BKASH",
    "CARD",
    "BANK_TRANSFER",
    "CASH",
]);

// ─── SaaS Plan ───────────────────────────────────────────────

export const CreateSaasPlanSchema = z.object({
    name: z
        .string()
        .min(2, "Plan name must be at least 2 characters")
        .max(100, "Plan name must be at most 100 characters")
        .trim(),
    tier: PlanTierEnum,
    monthlyPrice: z
        .number({ invalid_type_error: "Monthly price must be a number" })
        .nonnegative("Monthly price must be non-negative")
        .multipleOf(0.01, "Monthly price must have at most 2 decimal places"),
    yearlyPrice: z
        .number({ invalid_type_error: "Yearly price must be a number" })
        .nonnegative("Yearly price must be non-negative")
        .multipleOf(0.01, "Yearly price must have at most 2 decimal places"),
    maxDoctors: z
        .number()
        .int("maxDoctors must be an integer")
        .min(1, "At least 1 doctor must be allowed")
        .default(1),
    maxPatients: z
        .number()
        .int("maxPatients must be an integer")
        .min(1, "At least 1 patient must be allowed")
        .default(500),
    maxStorageGb: z
        .number()
        .int("maxStorageGb must be an integer")
        .min(1, "At least 1 GB of storage is required")
        .default(1),
    maxAppointments: z
        .number()
        .int("maxAppointments must be an integer")
        .min(-1, "Use -1 for unlimited appointments")
        .default(200),
    features: z
        .object({
            videoCall: z.boolean().default(false),
            audioCall: z.boolean().default(false),
            homeVisit: z.boolean().default(false),
            reportReview: z.boolean().default(false),
            customBranding: z.boolean().default(false),
            apiAccess: z.boolean().default(false),
        })
        .passthrough(), // allow future feature flags
    isActive: z.boolean().default(true),
});

export const UpdateSaasPlanSchema = CreateSaasPlanSchema.partial();

export type CreateSaasPlanInput = z.infer<typeof CreateSaasPlanSchema>;
export type UpdateSaasPlanInput = z.infer<typeof UpdateSaasPlanSchema>;


export const IdParamSchema = z.object({
    id: z.string().cuid("Invalid ID format"),
});

export type IdParam = z.infer<typeof IdParamSchema>;
