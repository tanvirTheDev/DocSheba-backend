/** @format */

// src/middlewares/authorize.middleware.ts
import { Request, Response, NextFunction } from "express";
import { Role } from "../generated/prisma/enums";

export const authorize =
    (...allowedRoles: Role[]) =>
    (req: Request, res: Response, next: NextFunction): void => {
        try {
            const user = req.user;

            if (!user) {
                res.status(401).json({
                    message: "Unauthorized: no user found in request",
                    error: "UNAUTHORIZED",
                });
                return;
            }

            if (!user.role) {
                res.status(403).json({
                    message: "Forbidden: user has no role assigned",
                    error: "FORBIDDEN",
                });
                return;
            }

            if (!allowedRoles.includes(user.role)) {
                res.status(403).json({
                    message: `Forbidden: requires one of [${allowedRoles.join(", ")}], but got [${user.role}]`,
                    error: "FORBIDDEN",
                });
                return;
            }

            next();
        } catch (error) {
            console.error("authorize middleware error:", error);
            res.status(500).json({
                message: "An unexpected error occurred during authorization",
                error: "INTERNAL_SERVER_ERROR",
            });
        }
    };
