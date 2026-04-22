/** @format */

import { z } from "zod";
import { Role } from "../../generated/prisma/enums";
// import { Role } from "../generated/prisma";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const emailField = z.string().trim().email("Invalid email address.");
const passwordField = z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number.");
const phoneField = z
    .string()
    .trim()
    .regex(/^\+?8801[3-9]\d{8}$/, "Invalid Bangladeshi phone number.")
    .optional();

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters.")
        .max(100),
    email: emailField,
    phone: phoneField,
    password: passwordField,
    role: z.nativeEnum(Role).refine((r) => r !== Role.SUPER_ADMIN, {
        message: "Cannot self-register as SUPER_ADMIN.",
    }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ─── Verify Email (OTP) ───────────────────────────────────────────────────────

export const verifyEmailSchema = z.object({
    email: emailField,
    code: z
        .string()
        .trim()
        .length(6, "OTP must be exactly 6 digits.")
        .regex(/^\d{6}$/, "OTP must contain only digits."),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
    email: emailField,
    password: z.string().min(1, "Password is required."),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Refresh Token ────────────────────────────────────────────────────────────

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, "Refresh token is required."),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

// ─── Forgot Password ──────────────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
    email: emailField,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// ─── Reset Password ───────────────────────────────────────────────────────────

export const resetPasswordSchema = z.object({
    email: emailField,
    code: z
        .string()
        .trim()
        .length(6, "OTP must be exactly 6 digits.")
        .regex(/^\d{6}$/, "OTP must contain only digits."),
    newPassword: passwordField,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ─── Change Password (authenticated) ─────────────────────────────────────────

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required."),
        newPassword: passwordField,
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
        message: "New password must be different from current password.",
        path: ["newPassword"],
    });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
