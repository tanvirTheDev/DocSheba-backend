/** @format */

import { Request, Response } from "express";
import {
    listUsersSchema,
    updateUserSchema,
    changeStatusSchema,
    userIdSchema,
} from "./schema";
import {
    listUsersService,
    getUserByIdService,
    updateUserService,
    changeUserStatusService,
    deactivateUserService,
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
