/** @format */

import { z } from "zod";

// ─── Audit Actions ────────────────────────────────────────────────────────────

export const AUDIT_ACTIONS = [
    "CREATE",
    "UPDATE",
    "DELETE",
    "LOGIN",
    "PRINT",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

// ─── Params ───────────────────────────────────────────────────────────────────

export const auditLogIdSchema = z.string().cuid("Invalid audit log ID.");

// ─── List Audit Logs ──────────────────────────────────────────────────────────

export const listAuditLogsSchema = z
    .object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        userId: z.string().cuid("Invalid user ID.").optional(),
        action: z.enum(AUDIT_ACTIONS).optional(),
        tableName: z.string().trim().optional(),
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
    })
    .refine(
        (d) => {
            if (d.from && d.to) return d.from <= d.to;
            return true;
        },
        {
            message: "'from' date must be before or equal to 'to' date.",
            path: ["from"],
        },
    );

export type ListAuditLogsInput = z.infer<typeof listAuditLogsSchema>;

// ─── Create Audit Log (internal — not exposed via HTTP) ───────────────────────

export type CreateAuditLogInput = {
    userId: string;
    action: AuditAction;
    tableName: string;
    recordId?: string;
    changes?: Record<string, unknown>;
};
