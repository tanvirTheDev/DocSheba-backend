/** @format */

import { Request, Response } from "express";
import { userIdParamSchema, upsertPatientProfileSchema } from "./schema";
import {
    getPatientProfileService,
    upsertPatientProfileService,
} from "./services";
import { Role } from "../../generated/prisma/enums";

// ─── Shared Error Handler ─────────────────────────────────────────────────────

const handleServiceError = (
    error: unknown,
    res: Response,
    context: string,
): void => {
    if (error instanceof Error) {
        const errorMap: Record<string, [number, string]> = {
            USER_NOT_FOUND: [404, "User not found."],
            USER_NOT_A_PATIENT: [400, "The specified user is not a patient."],
            PROFILE_NOT_FOUND: [404, "Patient profile not found."],
            FORBIDDEN: [403, "You are not allowed to access this profile."],
        };

        const match = errorMap[error.message];
        if (match) {
            res.status(match[0]).json({
                success: false,
                message: match[1],
                code: match[0],
            });
            return;
        }
    }

    console.error(`[${context}]`, error);
    res.status(500).json({
        success: false,
        message: "Internal server error.",
        code: 500,
    });
};

// ─── Get Patient Profile ──────────────────────────────────────────────────────

export const getPatientProfileController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedId = userIdParamSchema.safeParse(req.params.userId);

        if (!parsedId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid user ID.",
                errors: parsedId.error.flatten(),
            });
            return;
        }

        const { userId: requesterId, role: requesterRole } = req.user!;

        const profile = await getPatientProfileService(
            parsedId.data,
            requesterId,
            requesterRole as Role,
        );

        res.status(200).json({
            success: true,
            message: "Patient profile retrieved successfully.",
            data: profile,
        });
    } catch (error) {
        handleServiceError(error, res, "getPatientProfileController");
    }
};

// ─── Upsert Patient Profile ───────────────────────────────────────────────────

export const upsertPatientProfileController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedId = userIdParamSchema.safeParse(req.params.userId);

        if (!parsedId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid user ID.",
                errors: parsedId.error.flatten(),
            });
            return;
        }

        const parsed = upsertPatientProfileSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const { userId: requesterId, role: requesterRole } = req.user!;

        const profile = await upsertPatientProfileService(
            parsedId.data,
            parsed.data,
            requesterId,
            requesterRole as Role,
        );

        res.status(200).json({
            success: true,
            message: "Patient profile saved successfully.",
            data: profile,
        });
    } catch (error) {
        handleServiceError(error, res, "upsertPatientProfileController");
    }
};
