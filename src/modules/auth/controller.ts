/** @format */

import { Request, Response } from "express";
import {
    registerSchema,
    verifyEmailSchema,
    loginSchema,
    refreshTokenSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
} from "./schema";
import {
    registerService,
    verifyEmailService,
    loginService,
    refreshTokenService,
    logoutService,
    forgotPasswordService,
    resetPasswordService,
    changePasswordService,
    getMeService,
} from "./service";

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsed = registerSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const user = await registerService(parsed.data);

        res.status(201).json({
            success: true,
            message:
                "Account created. Please check your email for the verification OTP.",
            data: user,
        });
    } catch (error) {
        if (error instanceof Error && error.message === "EMAIL_TAKEN") {
            res.status(409).json({
                success: false,
                message: "An account with this email already exists.",
                code: 409,
            });
            return;
        }

        console.error("[registerController]", error);
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            code: 500,
        });
    }
};

// ─── Verify Email ─────────────────────────────────────────────────────────────

export const verifyEmailController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsed = verifyEmailSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const result = await verifyEmailService(parsed.data);

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "USER_NOT_FOUND") {
                res.status(400).json({
                    success: false,
                    message: "Invalid OTP or email.",
                    code: 400,
                });
                return;
            }
            if (error.message === "ALREADY_VERIFIED") {
                res.status(400).json({
                    success: false,
                    message: "This account is already verified.",
                    code: 400,
                });
                return;
            }
            if (error.message === "OTP_INVALID_OR_EXPIRED") {
                res.status(400).json({
                    success: false,
                    message: "OTP is invalid or has expired.",
                    code: 400,
                });
                return;
            }
        }

        console.error("[verifyEmailController]", error);
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            code: 500,
        });
    }
};

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsed = loginSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const result = await loginService(parsed.data);

        res.status(200).json({
            success: true,
            message: "Login successful.",
            data: result,
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "INVALID_CREDENTIALS") {
                res.status(401).json({
                    success: false,
                    message: "Invalid email or password.",
                    code: 401,
                });
                return;
            }
            if (error.message === "EMAIL_NOT_VERIFIED") {
                res.status(403).json({
                    success: false,
                    message: "Please verify your email before logging in.",
                    code: 403,
                });
                return;
            }
            if (error.message === "ACCOUNT_SUSPENDED") {
                res.status(403).json({
                    success: false,
                    message:
                        "Your account has been suspended. Contact support.",
                    code: 403,
                });
                return;
            }
            if (error.message === "ACCOUNT_INACTIVE") {
                res.status(403).json({
                    success: false,
                    message: "Your account is inactive.",
                    code: 403,
                });
                return;
            }
        }

        console.error("[loginController]", error);
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            code: 500,
        });
    }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────

export const refreshTokenController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsed = refreshTokenSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const result = await refreshTokenService(parsed.data);

        res.status(200).json({
            success: true,
            message: "Token refreshed.",
            data: result,
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "REFRESH_TOKEN_INVALID"
        ) {
            res.status(401).json({
                success: false,
                message: "Refresh token is invalid or expired.",
                code: 401,
            });
            return;
        }

        console.error("[refreshTokenController]", error);
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            code: 500,
        });
    }
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logoutController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { userId } = req.user!;

        // Accept refresh token from body or Authorization header
        const refreshToken =
            req.body?.refreshToken ??
            req.headers.authorization?.replace("Bearer ", "") ??
            "";

        const result = await logoutService(userId, refreshToken);

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        console.error("[logoutController]", error);
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            code: 500,
        });
    }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────

export const forgotPasswordController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsed = forgotPasswordSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const result = await forgotPasswordService(parsed.data);

        // Always 200 to prevent email enumeration
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        console.error("[forgotPasswordController]", error);
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            code: 500,
        });
    }
};

// ─── Reset Password ───────────────────────────────────────────────────────────

export const resetPasswordController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsed = resetPasswordSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const result = await resetPasswordService(parsed.data);

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "OTP_INVALID_OR_EXPIRED"
        ) {
            res.status(400).json({
                success: false,
                message: "OTP is invalid or has expired.",
                code: 400,
            });
            return;
        }

        console.error("[resetPasswordController]", error);
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            code: 500,
        });
    }
};

// ─── Change Password (authenticated) ─────────────────────────────────────────

export const changePasswordController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { userId } = req.user!;

        const parsed = changePasswordSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const result = await changePasswordService(userId, parsed.data);

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "USER_NOT_FOUND") {
                res.status(404).json({
                    success: false,
                    message: "User not found.",
                    code: 404,
                });
                return;
            }
            if (error.message === "CURRENT_PASSWORD_INCORRECT") {
                res.status(400).json({
                    success: false,
                    message: "Current password is incorrect.",
                    code: 400,
                });
                return;
            }
        }

        console.error("[changePasswordController]", error);
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            code: 500,
        });
    }
};

// ─── Get Me ───────────────────────────────────────────────────────────────────

export const getMeController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { userId } = req.user!;

        const user = await getMeService(userId);

        res.status(200).json({
            success: true,
            message: "User retrieved successfully.",
            data: user,
        });
    } catch (error) {
        if (error instanceof Error && error.message === "USER_NOT_FOUND") {
            res.status(404).json({
                success: false,
                message: "User not found.",
                code: 404,
            });
            return;
        }

        console.error("[getMeController]", error);
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            code: 500,
        });
    }
};
