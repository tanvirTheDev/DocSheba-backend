/** @format */
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

// ─── Subscription ────────────────────────────────────────────

export const CreateSubscriptionSchema = z.object({
    planId: z.string().cuid("Invalid plan ID"),
    billingCycle: BillingCycleEnum.default("MONTHLY"),
    autoRenew: z.boolean().default(true),
    trialEndsAt: z.coerce.date().optional(),
});

export const UpdateSubscriptionSchema = z
    .object({
        planId: z.string().cuid("Invalid plan ID"),
        billingCycle: BillingCycleEnum,
        autoRenew: z.boolean(),
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update",
    });

export const CancelSubscriptionSchema = z.object({
    cancellationNote: z
        .string()
        .max(500, "Cancellation note must be at most 500 characters")
        .optional(),
});

export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof UpdateSubscriptionSchema>;
export type CancelSubscriptionInput = z.infer<typeof CancelSubscriptionSchema>;

export const IdParamSchema = z.object({
    id: z.string().cuid("Invalid ID format"),
});

export type IdParam = z.infer<typeof IdParamSchema>;
