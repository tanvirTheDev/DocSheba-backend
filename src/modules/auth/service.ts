/** @format */

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
import {
    generateAccessToken,
    generateOtp,
    generateRefreshToken,
    getOtpExpiresAt,
    hashOtp,
    hashPassword,
    verifyOtp,
    verifyPassword,
    verifyRefreshToken,
} from "../../utils/token";

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerService = async (data: RegisterInput) => {
    const { name, email, phone, password, role } = data;

    const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
    });

    if (existing) throw new Error("EMAIL_TAKEN");

    const hashedPassword = await hashPassword(password);

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
        select: { id: true, name: true, email: true, role: true },
    });

    const otp = generateOtp();
    const hashedOtp = hashOtp(otp);

    await prisma.verificationCode.create({
        data: {
            userId: user.id,
            code: hashedOtp,
            type: VerificationCodeType.ACCOUNT_ACTIVATION,
            status: VerificationStatus.PENDING,
            expiresAt: getOtpExpiresAt(),
        },
    });

    // TODO: await emailService.sendVerificationEmail(user.email, otp);
    console.log(`[DEV] OTP for ${email}: ${otp}`);

    return user;
};

// ─── Verify Email ─────────────────────────────────────────────────────────────

export const verifyEmailService = async (data: VerifyEmailInput) => {
    const { email, code } = data;

    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, verified: true },
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

    const isMatch = verifyOtp(code, verificationCode.code);
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

    const passwordMatch = await verifyPassword(password, user.password);
    if (!passwordMatch) throw new Error("INVALID_CREDENTIALS");

    if (!user.verified || user.status === AccountStatus.PENDING)
        throw new Error("EMAIL_NOT_VERIFIED");
    if (user.status === AccountStatus.SUSPENDED)
        throw new Error("ACCOUNT_SUSPENDED");
    if (user.status === AccountStatus.INACTIVE)
        throw new Error("ACCOUNT_INACTIVE");

    const accessToken = generateAccessToken({
        userId: user.id,
        role: user.role,
        email: user.email,
        isEmailVerified: user.verified,
    });
    const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
    });

    await prisma.refresh.create({
        data: { userId: user.id, email: user.email, token: refreshToken },
    });

    const { password: _pw, ...safeUser } = user;

    return { accessToken, refreshToken, user: safeUser };
};

// ─── Refresh Token ────────────────────────────────────────────────────────────

export const refreshTokenService = async (data: RefreshTokenInput) => {
    const { refreshToken } = data;

    let decoded: { userId: string; email: string };
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch {
        throw new Error("REFRESH_TOKEN_INVALID");
    }

    const stored = await prisma.refresh.findFirst({
        where: { token: refreshToken, userId: decoded.userId },
    });
    if (!stored) throw new Error("REFRESH_TOKEN_INVALID");

    const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            verified: true,
            status: true,
        },
    });

    if (!user || user.status !== AccountStatus.ACTIVE)
        throw new Error("REFRESH_TOKEN_INVALID");

    // Token rotation — delete old, issue new
    await prisma.refresh.delete({ where: { id: stored.id } });

    const newAccessToken = generateAccessToken({
        userId: user.id,
        role: user.role,
        email: user.email,
        isEmailVerified: user.verified,
    });
    const newRefreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
    });

    await prisma.refresh.create({
        data: { userId: user.id, email: user.email, token: newRefreshToken },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken, user };
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logoutService = async (userId: string, refreshToken: string) => {
    await prisma.refresh.deleteMany({ where: { userId, token: refreshToken } });
    return { message: "Logged out successfully." };
};

// ─── Forgot Password ──────────────────────────────────────────────────────────

export const forgotPasswordService = async (data: ForgotPasswordInput) => {
    const { email } = data;

    const GENERIC_RESPONSE = {
        message:
            "If this email is registered and active, an OTP has been sent.",
    };

    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, verified: true, status: true },
    });

    if (!user || !user.verified || user.status !== AccountStatus.ACTIVE)
        return GENERIC_RESPONSE;

    // Invalidate any previous unused reset codes
    await prisma.verificationCode.updateMany({
        where: {
            userId: user.id,
            type: VerificationCodeType.PASSWORD_RESET,
            status: VerificationStatus.PENDING,
        },
        data: { status: VerificationStatus.EXPIRED },
    });

    const otp = generateOtp();
    const hashedOtp = hashOtp(otp);

    await prisma.verificationCode.create({
        data: {
            userId: user.id,
            code: hashedOtp,
            type: VerificationCodeType.PASSWORD_RESET,
            status: VerificationStatus.PENDING,
            expiresAt: getOtpExpiresAt(),
        },
    });

    // TODO: await emailService.sendPasswordResetEmail(email, otp);
    console.log(`[DEV] Reset OTP for ${email}: ${otp}`);

    return GENERIC_RESPONSE;
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

    const isMatch = verifyOtp(code, verificationCode.code);
    if (!isMatch) throw new Error("OTP_INVALID_OR_EXPIRED");

    const hashedPassword = await hashPassword(newPassword);

    await prisma.$transaction([
        prisma.verificationCode.update({
            where: { id: verificationCode.id },
            data: { status: VerificationStatus.USED, verifiedAt: new Date() },
        }),
        prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        }),
        prisma.refresh.deleteMany({ where: { userId: user.id } }),
    ]);

    return { message: "Password reset successfully." };
};

// ─── Change Password ──────────────────────────────────────────────────────────

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

    const isMatch = await verifyPassword(currentPassword, user.password);
    if (!isMatch) throw new Error("CURRENT_PASSWORD_INCORRECT");

    const hashedPassword = await hashPassword(newPassword);

    await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        }),
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
