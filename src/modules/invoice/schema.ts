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

// ─── Invoice ─────────────────────────────────────────────────

export const ListInvoicesQuerySchema = z.object({
    page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100, "Limit must not exceed 100")
        .default(20),
    subscriptionId: z.string().cuid("Invalid subscription ID").optional(),
    status: PaymentStatusEnum.optional(),
});

export const UpdateInvoiceSchema = z
    .object({
        status: PaymentStatusEnum,
        transactionId: z
            .string()
            .min(1, "Transaction ID must not be empty")
            .optional(),
        method: PaymentMethodEnum.optional(),
        paidAt: z.coerce.date().optional(),
    })
    .refine(
        (data) => {
            // If marking as PAID, transactionId and paidAt should be present
            if (data.status === "PAID") {
                return !!data.transactionId && !!data.paidAt;
            }
            return true;
        },
        {
            message:
                "transactionId and paidAt are required when marking an invoice as PAID",
            path: ["transactionId"],
        },
    );

export type ListInvoicesQuery = z.infer<typeof ListInvoicesQuerySchema>;
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>;

// ─── Shared ───────────────────────────────────────────────────

export const IdParamSchema = z.object({
    id: z.string().cuid("Invalid ID format"),
});

export type IdParam = z.infer<typeof IdParamSchema>;
