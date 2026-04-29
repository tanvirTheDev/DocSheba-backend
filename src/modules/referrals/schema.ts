/** @format */

import { z } from "zod";
import {
    ReferralAgentType,
    CommissionType,
} from "../../generated/prisma/client";

// ─── Params ───────────────────────────────────────────────────────────────────

export const agentIdSchema = z.string().cuid("Invalid agent ID.");
export const referralIdSchema = z.string().cuid("Invalid referral ID.");

// ══════════════════════════════════════════════════════════════════════════════
// REFERRAL AGENT
// ══════════════════════════════════════════════════════════════════════════════

export const listAgentsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    agentType: z.nativeEnum(ReferralAgentType).optional(),
    isActive: z
        .union([z.boolean(), z.enum(["true", "false"])])
        .optional()
        .transform((v) =>
            v === undefined
                ? undefined
                : v === "true"
                  ? true
                  : v === "false"
                    ? false
                    : v,
        ),
});

export type ListAgentsInput = z.infer<typeof listAgentsSchema>;

// ─── Referral Agent ───────────────────────────────────────────────────────────

const agentBaseSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters.")
        .max(100),
    phone: z
        .string()
        .trim()
        .regex(/^\+?8801[3-9]\d{8}$/, "Invalid Bangladeshi phone number.")
        .optional()
        .nullable(),
    email: z
        .string()
        .trim()
        .email("Invalid email address.")
        .optional()
        .nullable(),
    organization: z.string().trim().max(200).optional().nullable(),
    agentType: z.nativeEnum(ReferralAgentType).default(ReferralAgentType.OTHER),
    commissionType: z.nativeEnum(CommissionType).default(CommissionType.NONE),
    commissionValue: z
        .number()
        .positive("Commission value must be positive.")
        .multipleOf(0.01)
        .optional()
        .nullable(),
    notes: z.string().trim().max(500).optional().nullable(),
    isActive: z.boolean().default(true),
});

// ✅ create applies refine AFTER the base object
export const createAgentSchema = agentBaseSchema
    .refine(
        (d) => {
            if (d.commissionType !== CommissionType.NONE && !d.commissionValue)
                return false;
            return true;
        },
        {
            message:
                "commissionValue is required when commissionType is FLAT or PERCENTAGE.",
            path: ["commissionValue"],
        },
    )
    .refine(
        (d) => {
            if (
                d.commissionType === CommissionType.PERCENTAGE &&
                d.commissionValue
            )
                return d.commissionValue <= 100;
            return true;
        },
        {
            message: "Percentage commission cannot exceed 100.",
            path: ["commissionValue"],
        },
    );

// ✅ update calls .partial() on the BASE schema before refine
export const updateAgentSchema = agentBaseSchema
    .partial()
    .refine((d) => Object.keys(d).length > 0, {
        message: "At least one field must be provided for update.",
    });

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// REFERRAL
// ══════════════════════════════════════════════════════════════════════════════

export const listReferralsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    agentId: z.string().cuid("Invalid agent ID.").optional(),
    isPaid: z
        .union([z.boolean(), z.enum(["true", "false"])])
        .optional()
        .transform((v) =>
            v === undefined
                ? undefined
                : v === "true"
                  ? true
                  : v === "false"
                    ? false
                    : v,
        ),
});

export type ListReferralsInput = z.infer<typeof listReferralsSchema>;

export const createReferralSchema = z.object({
    agentId: z.string().cuid("Invalid agent ID."),
    appointmentId: z.string().cuid("Invalid appointment ID."),
    notes: z.string().trim().max(500).optional().nullable(),
});

export type CreateReferralInput = z.infer<typeof createReferralSchema>;

export const markPaidSchema = z.object({
    isPaid: z.literal(true, {
        errorMap: () => ({ message: "isPaid must be true." }),
    }),
    paidAt: z.coerce.date().optional(),
});

export type MarkPaidInput = z.infer<typeof markPaidSchema>;
