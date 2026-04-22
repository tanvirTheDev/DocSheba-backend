/** @format */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { decodeAccessToken } from "../utils/token";

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.status(401).json({
                message: "Unauthorized: no authorization header",
                error: "UNAUTHORIZED",
            });
            return;
        }

        if (!authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                message:
                    "Unauthorized: authorization header must be Bearer token",
                error: "UNAUTHORIZED",
            });
            return;
        }

        const accessToken = authHeader.split(" ")[1];

        if (!accessToken) {
            res.status(401).json({
                message: "Unauthorized: Access Token is missing",
                error: "UNAUTHORIZED",
            });
            return;
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("JWT_SECRET is not defined in environment variables");
            res.status(500).json({
                message: "Internal server error",
                error: "INTERNAL_SERVER_ERROR",
            });
            return;
        }

        const decoded = decodeAccessToken(accessToken);

        req.user = {
            userId: decoded.userId,
            role: decoded.role,
            email: decoded.email,
            isEmailVerified: decoded.isEmailVerified,
        };
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                message: "Unauthorized: token has expired",
                error: "TOKEN_EXPIRED",
            });
            return;
        }

        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                message: "Unauthorized: invalid token",
                error: "INVALID_TOKEN",
            });
            return;
        }

        if (error instanceof jwt.NotBeforeError) {
            res.status(401).json({
                message: "Unauthorized: token not yet valid",
                error: "TOKEN_NOT_VALID_YET",
            });
            return;
        }

        console.error("authenticate middleware error:", error);
        res.status(500).json({
            message: "An unexpected error occurred during authentication",
            error: "INTERNAL_SERVER_ERROR",
        });
    }
};
