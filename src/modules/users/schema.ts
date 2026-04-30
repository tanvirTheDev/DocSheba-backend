/** @format */

import { z } from "zod";
import { AccountStatus, Role } from "../../generated/prisma/enums";

// ─── Params ───────────────────────────────────────────────────────────────────

export const userIdSchema = z.string().cuid("Invalid user ID.");

// ─── List Users (Admin) ───────────────────────────────────────────────────────

export const listUsersSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    role: z.nativeEnum(Role).optional(),
    status: z.nativeEnum(AccountStatus).optional(),
    search: z.string().trim().optional(),
});

export type ListUsersInput = z.infer<typeof listUsersSchema>;

// ─── Update User ──────────────────────────────────────────────────────────────

export const updateUserSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(2, "Name must be at least 2 characters.")
            .max(100)
            .optional(),
        phone: z
            .string()
            .trim()
            .regex(/^\+?8801[3-9]\d{8}$/, "Invalid Bangladeshi phone number.")
            .optional()
            .nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update.",
    });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ─── Change Status (Admin) ────────────────────────────────────────────────────

export const changeStatusSchema = z.object({
    status: z.nativeEnum(AccountStatus),
});

export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;

export const assignAssistantSchema = z.object({
    assistantId: z.string().cuid("Invalid assistant user ID."),
});

export const removeAssistantSchema = z.object({
    assistantId: z.string().cuid("Invalid assistant user ID."),
});

export type AssignAssistantInput = z.infer<typeof assignAssistantSchema>;
