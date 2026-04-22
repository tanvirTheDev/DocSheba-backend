/** @format */

import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

// ─── Config ───────────────────────────────────────────────────────────────────

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "access_secret_dev";
const JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ?? "refresh_secret_dev";

const BCRYPT_ROUNDS = 10;
const OTP_EXPIRY_MINUTES = 15;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AccessTokenPayload {
    userId: string;
    role: string;
    email: string;
    isEmailVerified: boolean;
}

export interface RefreshTokenPayload {
    userId: string;
    email: string;
}

// ─── OTP ──────────────────────────────────────────────────────────────────────

/**
 * Cryptographically secure 6-digit OTP via crypto.randomInt.
 * Avoids Math.random() which is NOT cryptographically secure.
 */
const generateOtp = (): string => crypto.randomInt(100_000, 999_999).toString();

const getOtpExpiresAt = (): Date =>
    new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1_000);

// ─── Hashing ──────────────────────────────────────────────────────────────────

const hashPassword = (plain: string): Promise<string> =>
    bcrypt.hash(plain, BCRYPT_ROUNDS);

const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
    bcrypt.compare(plain, hash);

// ─── JWT ──────────────────────────────────────────────────────────────────────

const generateAccessToken = (payload: AccessTokenPayload): string =>
    jwt.sign(payload, JWT_ACCESS_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
    } as jwt.SignOptions);

const generateRefreshToken = (payload: RefreshTokenPayload): string =>
    jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRY,
    } as jwt.SignOptions);

const verifyAccessToken = (token: string): AccessTokenPayload =>
    jwt.verify(token, JWT_ACCESS_SECRET) as AccessTokenPayload;

const verifyRefreshToken = (token: string): RefreshTokenPayload =>
    jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;

/**
 * Returns true if expired, false if still valid.
 * Throws if the token is malformed or has no `exp` claim.
 */
const isTokenExpired = (token: string, secret: string): boolean => {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    if (!decoded.exp) throw new Error("Token has no expiration claim");
    return Math.floor(Date.now() / 1_000) > decoded.exp;
};

const decodeAccessToken = (token: string): AccessTokenPayload =>
    jwt.verify(token, JWT_ACCESS_SECRET) as AccessTokenPayload;

const decodeRefreshToken = (token: string): RefreshTokenPayload =>
    jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;

const hashOtp = (otp: string): string =>
    crypto.createHash("sha256").update(otp).digest("hex");

const verifyOtp = (plain: string, hash: string): boolean =>
    crypto.timingSafeEqual(Buffer.from(hashOtp(plain)), Buffer.from(hash));
// ─── Export ───────────────────────────────────────────────────────────────────

export {
    generateOtp,
    getOtpExpiresAt,
    hashPassword,
    verifyPassword,
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    isTokenExpired,
    decodeAccessToken,
    decodeRefreshToken,
    hashOtp,
    verifyOtp,
};
