/** @format */

import { Request, Response } from "express";
import {
    listUsersSchema,
    updateUserSchema,
    changeStatusSchema,
    userIdSchema,
    assignAssistantSchema,
} from "./schema";
import {
    listUsersService,
    getUserByIdService,
    updateUserService,
    changeUserStatusService,
    deactivateUserService,
    assignAssistantService,
    removeAssistantService,
    listAssistantsService,
} from "./services";

// ─── List Users (Admin) ───────────────────────────────────────────────────────

export const listUsersController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsed = listUsersSchema.safeParse(req.query);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Invalid query parameters.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const result = await listUsersService(parsed.data);

        res.status(200).json({
            success: true,
            message: "Users retrieved successfully.",
            data: result.users,
            meta: result.meta,
        });
    } catch (error) {
        console.error("[listUsersController]", error);
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            code: 500,
        });
    }
};

// ─── Get User By ID ───────────────────────────────────────────────────────────

export const getUserByIdController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedId = userIdSchema.safeParse(req.params.id);

        if (!parsedId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid user ID.",
                errors: parsedId.error.flatten(),
            });
            return;
        }

        const user = await getUserByIdService(parsedId.data);

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

        console.error("[getUserByIdController]", error);
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            code: 500,
        });
    }
};

// ─── Update User ──────────────────────────────────────────────────────────────

export const updateUserController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedId = userIdSchema.safeParse(req.params.id);

        if (!parsedId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid user ID.",
                errors: parsedId.error.flatten(),
            });
            return;
        }

        const parsed = updateUserSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const user = await updateUserService(parsedId.data, parsed.data);

        res.status(200).json({
            success: true,
            message: "User updated successfully.",
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

        console.error("[updateUserController]", error);
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            code: 500,
        });
    }
};

// ─── Change Account Status (Admin) ───────────────────────────────────────────

export const changeUserStatusController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedId = userIdSchema.safeParse(req.params.id);

        if (!parsedId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid user ID.",
                errors: parsedId.error.flatten(),
            });
            return;
        }

        const parsed = changeStatusSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const user = await changeUserStatusService(parsedId.data, parsed.data);

        res.status(200).json({
            success: true,
            message: `User status updated to ${parsed.data.status}.`,
            data: user,
        });
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
            if (error.message === "CANNOT_MODIFY_SUPER_ADMIN") {
                res.status(403).json({
                    success: false,
                    message: "Cannot change the status of a SUPER_ADMIN.",
                    code: 403,
                });
                return;
            }
            if (error.message === "STATUS_ALREADY_SET") {
                res.status(400).json({
                    success: false,
                    message: "User already has this status.",
                    code: 400,
                });
                return;
            }
        }

        console.error("[changeUserStatusController]", error);
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            code: 500,
        });
    }
};

// ─── Deactivate User (Soft Delete) ───────────────────────────────────────────

export const deactivateUserController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedId = userIdSchema.safeParse(req.params.id);

        if (!parsedId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid user ID.",
                errors: parsedId.error.flatten(),
            });
            return;
        }

        const { userId: requesterId, role: requesterRole } = req.user!;

        const result = await deactivateUserService(
            parsedId.data,
            requesterId,
            requesterRole,
        );

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
            if (error.message === "CANNOT_MODIFY_SUPER_ADMIN") {
                res.status(403).json({
                    success: false,
                    message: "Cannot deactivate a SUPER_ADMIN.",
                    code: 403,
                });
                return;
            }
            if (error.message === "CANNOT_DEACTIVATE_SELF") {
                res.status(400).json({
                    success: false,
                    message: "You cannot deactivate your own account.",
                    code: 400,
                });
                return;
            }
            if (error.message === "USER_ALREADY_INACTIVE") {
                res.status(400).json({
                    success: false,
                    message: "User is already inactive.",
                    code: 400,
                });
                return;
            }
        }

        console.error("[deactivateUserController]", error);
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            code: 500,
        });
    }
};

// modules/users/user.controller.ts — add these

export const assignAssistantController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedDoctorId = userIdSchema.safeParse(req.params.doctorId);

        if (!parsedDoctorId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid doctor ID.",
                errors: parsedDoctorId.error.flatten(),
            });
            return;
        }

        const parsed = assignAssistantSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const result = await assignAssistantService(
            parsedDoctorId.data,
            parsed.data.assistantId,
        );

        res.status(200).json({
            success: true,
            message: "Assistant assigned to doctor successfully.",
            data: result,
        });
    } catch (error) {
        if (error instanceof Error) {
            const map: Record<string, [number, string]> = {
                USER_NOT_FOUND: [404, "Doctor not found."],
                TARGET_NOT_A_DOCTOR: [400, "Target user is not a doctor."],
                ASSISTANT_NOT_FOUND: [404, "Assistant user not found."],
                USER_NOT_AN_ASSISTANT: [
                    400,
                    "Target user does not have the DOCTOR_ASSISTANT role.",
                ],
                ASSISTANT_ALREADY_ASSIGNED: [
                    409,
                    "This assistant is already assigned to another doctor.",
                ],
                ALREADY_ASSIGNED_TO_THIS_DOCTOR: [
                    400,
                    "This assistant is already assigned to this doctor.",
                ],
            };
            const match = map[error.message];
            if (match) {
                res.status(match[0]).json({
                    success: false,
                    message: match[1],
                    code: match[0],
                });
                return;
            }
        }

        console.error("[assignAssistantController]", error);
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            code: 500,
        });
    }
};

export const removeAssistantController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedDoctorId = userIdSchema.safeParse(req.params.doctorId);
        const parsedAssistantId = userIdSchema.safeParse(
            req.params.assistantId,
        );

        if (!parsedDoctorId.success || !parsedAssistantId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid doctor ID or assistant ID.",
            });
            return;
        }

        const result = await removeAssistantService(
            parsedDoctorId.data,
            parsedAssistantId.data,
        );

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        if (error instanceof Error) {
            const map: Record<string, [number, string]> = {
                ASSISTANT_NOT_FOUND: [404, "Assistant user not found."],
                USER_NOT_AN_ASSISTANT: [
                    400,
                    "Target user does not have the DOCTOR_ASSISTANT role.",
                ],
                NOT_ASSIGNED_TO_THIS_DOCTOR: [
                    400,
                    "This assistant is not assigned to this doctor.",
                ],
            };
            const match = map[error.message];
            if (match) {
                res.status(match[0]).json({
                    success: false,
                    message: match[1],
                    code: match[0],
                });
                return;
            }
        }

        console.error("[removeAssistantController]", error);
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            code: 500,
        });
    }
};

export const listAssistantsController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedId = userIdSchema.safeParse(req.params.doctorId);

        if (!parsedId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid doctor ID.",
                errors: parsedId.error.flatten(),
            });
            return;
        }

        const assistants = await listAssistantsService(parsedId.data);

        res.status(200).json({
            success: true,
            message: "Assistants retrieved successfully.",
            data: assistants,
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "USER_NOT_FOUND") {
                res.status(404).json({
                    success: false,
                    message: "Doctor not found.",
                    code: 404,
                });
                return;
            }
            if (error.message === "TARGET_NOT_A_DOCTOR") {
                res.status(400).json({
                    success: false,
                    message: "Target user is not a doctor.",
                    code: 400,
                });
                return;
            }
        }

        console.error("[listAssistantsController]", error);
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            code: 500,
        });
    }
};
