/** @format */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
    ChangePasswordInput,
    ForgotPasswordInput,
    LoginInput,
    RefreshTokenInput,
    RegisterInput,
    ResetPasswordInput,
    VerifyEmailInput,
} from "./schema";
import { prisma } from "../../lib/prisma";
import {
    AccountStatus,
    VerificationCodeType,
    VerificationStatus,
} from "../../generated/prisma/enums";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const BCRYPT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 15;

// ─── Token Helpers ────────────────────────────────────────────────────────────

const generateAccessToken = (payload: {
    id: string;
    role: string;
    email: string;
}) => jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: "15m" });

const generateRefreshToken = (payload: { id: string; email: string }) =>
    jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });

const generateOtp = (): string =>
    Math.floor(100000 + Math.random() * 900000).toString();

const otpExpiresAt = (): Date =>
    new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerService = async (data: RegisterInput) => {
    const { name, email, phone, password, role } = data;

    const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
    });

    if (existing) throw new Error("EMAIL_TAKEN");

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            phone: phone ?? null,
            password: hashedPassword,
            role,
            status: AccountStatus.PENDING,
            verified: false,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    });

    // ── Create OTP ────────────────────────────────────────────────────────────
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await prisma.verificationCode.create({
        data: {
            userId: user.id,
            code: hashedOtp,
            type: VerificationCodeType.ACCOUNT_ACTIVATION,
            status: VerificationStatus.PENDING,
            expiresAt: otpExpiresAt(),
        },
    });

    // TODO: send OTP via email service
    // await emailService.sendVerificationEmail(user.email, otp);
    console.log(`[DEV] OTP for ${email}: ${otp}`);

    return user;
};

// ─── Verify Email ─────────────────────────────────────────────────────────────

export const verifyEmailService = async (data: VerifyEmailInput) => {
    const { email, code } = data;

    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, verified: true, status: true },
    });

    if (!user) throw new Error("USER_NOT_FOUND");
    if (user.verified) throw new Error("ALREADY_VERIFIED");

    const verificationCode = await prisma.verificationCode.findFirst({
        where: {
            userId: user.id,
            type: VerificationCodeType.ACCOUNT_ACTIVATION,
            status: VerificationStatus.PENDING,
            expiresAt: { gt: new Date() },
        },
        orderBy: { issuedAt: "desc" },
    });

    if (!verificationCode) throw new Error("OTP_INVALID_OR_EXPIRED");

    const isMatch = await bcrypt.compare(code, verificationCode.code);
    if (!isMatch) throw new Error("OTP_INVALID_OR_EXPIRED");

    await prisma.$transaction([
        prisma.verificationCode.update({
            where: { id: verificationCode.id },
            data: { status: VerificationStatus.USED, verifiedAt: new Date() },
        }),
        prisma.user.update({
            where: { id: user.id },
            data: { verified: true, status: AccountStatus.ACTIVE },
        }),
    ]);

    return { message: "Email verified. Account is now active." };
};

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginService = async (data: LoginInput) => {
    const { email, password } = data;

    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            password: true,
            verified: true,
            status: true,
        },
    });

    if (!user) throw new Error("INVALID_CREDENTIALS");

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new Error("INVALID_CREDENTIALS");

    if (!user.verified || user.status === AccountStatus.PENDING)
        throw new Error("EMAIL_NOT_VERIFIED");

    if (user.status === AccountStatus.SUSPENDED)
        throw new Error("ACCOUNT_SUSPENDED");

    if (user.status === AccountStatus.INACTIVE)
        throw new Error("ACCOUNT_INACTIVE");

    const tokenPayload = { id: user.id, role: user.role, email: user.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({
        id: user.id,
        email: user.email,
    });

    await prisma.refresh.create({
        data: {
            userId: user.id,
            email: user.email,
            token: refreshToken,
        },
    });

    const { password: _, ...safeUser } = user;

    return { accessToken, refreshToken, user: safeUser };
};

// ─── Refresh Token ────────────────────────────────────────────────────────────

export const refreshTokenService = async (data: RefreshTokenInput) => {
    const { refreshToken } = data;

    // Verify JWT signature first
    let decoded: { id: string; email: string };
    try {
        decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
            id: string;
            email: string;
        };
    } catch {
        throw new Error("REFRESH_TOKEN_INVALID");
    }

    // Check it exists in DB (rotation guard)
    const stored = await prisma.refresh.findFirst({
        where: { token: refreshToken, userId: decoded.id },
    });

    if (!stored) throw new Error("REFRESH_TOKEN_INVALID");

    const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, role: true, status: true },
    });

    if (!user || user.status !== AccountStatus.ACTIVE)
        throw new Error("REFRESH_TOKEN_INVALID");

    // Token rotation — delete old, issue new
    await prisma.refresh.delete({ where: { id: stored.id } });

    const newAccessToken = generateAccessToken({
        id: user.id,
        role: user.role,
        email: user.email,
    });
    const newRefreshToken = generateRefreshToken({
        id: user.id,
        email: user.email,
    });

    await prisma.refresh.create({
        data: {
            userId: user.id,
            email: user.email,
            token: newRefreshToken,
        },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken, user };
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logoutService = async (userId: string, refreshToken: string) => {
    await prisma.refresh.deleteMany({
        where: { userId, token: refreshToken },
    });

    return { message: "Logged out successfully." };
};

// ─── Forgot Password ──────────────────────────────────────────────────────────

export const forgotPasswordService = async (data: ForgotPasswordInput) => {
    const { email } = data;

    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, verified: true, status: true },
    });

    // Generic response to prevent email enumeration
    if (!user || !user.verified || user.status !== AccountStatus.ACTIVE) {
        return {
            message:
                "If this email is registered and active, an OTP has been sent.",
        };
    }

    // Invalidate previous unused reset codes
    await prisma.verificationCode.updateMany({
        where: {
            userId: user.id,
            type: VerificationCodeType.PASSWORD_RESET,
            status: VerificationStatus.PENDING,
        },
        data: { status: VerificationStatus.EXPIRED },
    });

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await prisma.verificationCode.create({
        data: {
            userId: user.id,
            code: hashedOtp,
            type: VerificationCodeType.PASSWORD_RESET,
            status: VerificationStatus.PENDING,
            expiresAt: otpExpiresAt(),
        },
    });

    // TODO: send OTP via email service
    // await emailService.sendPasswordResetEmail(email, otp);
    console.log(`[DEV] Reset OTP for ${email}: ${otp}`);

    return {
        message:
            "If this email is registered and active, an OTP has been sent.",
    };
};

// ─── Reset Password ───────────────────────────────────────────────────────────

export const resetPasswordService = async (data: ResetPasswordInput) => {
    const { email, code, newPassword } = data;

    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
    });

    if (!user) throw new Error("OTP_INVALID_OR_EXPIRED");

    const verificationCode = await prisma.verificationCode.findFirst({
        where: {
            userId: user.id,
            type: VerificationCodeType.PASSWORD_RESET,
            status: VerificationStatus.PENDING,
            expiresAt: { gt: new Date() },
        },
        orderBy: { issuedAt: "desc" },
    });

    if (!verificationCode) throw new Error("OTP_INVALID_OR_EXPIRED");

    const isMatch = await bcrypt.compare(code, verificationCode.code);
    if (!isMatch) throw new Error("OTP_INVALID_OR_EXPIRED");

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await prisma.$transaction([
        prisma.verificationCode.update({
            where: { id: verificationCode.id },
            data: { status: VerificationStatus.USED, verifiedAt: new Date() },
        }),
        prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        }),
        // Invalidate all refresh tokens on password reset
        prisma.refresh.deleteMany({ where: { userId: user.id } }),
    ]);

    return { message: "Password reset successfully." };
};

// ─── Change Password (authenticated) ─────────────────────────────────────────

export const changePasswordService = async (
    userId: string,
    data: ChangePasswordInput,
) => {
    const { currentPassword, newPassword } = data;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true },
    });

    if (!user) throw new Error("USER_NOT_FOUND");

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new Error("CURRENT_PASSWORD_INCORRECT");

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        }),
        // Invalidate all refresh tokens on password change
        prisma.refresh.deleteMany({ where: { userId } }),
    ]);

    return { message: "Password changed successfully." };
};

// ─── Get Me ───────────────────────────────────────────────────────────────────

export const getMeService = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            verified: true,
            status: true,
            createdAt: true,
        },
    });

    if (!user) throw new Error("USER_NOT_FOUND");

    return user;
};
