/** @format */

import { Request, Response } from "express";
import {
    userIdParamSchema,
    serviceIdParamSchema,
    upsertDoctorProfileSchema,
    createDoctorServiceSchema,
    updateDoctorServiceSchema,
} from "./schema";
import {
    getDoctorProfileService,
    upsertDoctorProfileService,
    listDoctorServicesService,
    addDoctorServiceService,
    updateDoctorServiceService,
    deleteDoctorServiceService,
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
            USER_NOT_A_DOCTOR: [400, "The specified user is not a doctor."],
            PROFILE_NOT_FOUND: [404, "Doctor profile not found."],
            FORBIDDEN: [403, "You are not allowed to perform this action."],
            LICENSE_NO_TAKEN: [
                409,
                "This license number is already registered to another doctor.",
            ],
            SERVICE_NOT_FOUND: [404, "Doctor service not found."],
            SERVICE_TYPE_DUPLICATE: [
                409,
                "This doctor already has a configuration for this service type.",
            ],
            SERVICE_HAS_APPOINTMENTS: [
                409,
                "Cannot delete a service that has existing appointments. Deactivate it instead.",
            ],
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

// ─── Get Doctor Profile ───────────────────────────────────────────────────────

export const getDoctorProfileController = async (
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

        const profile = await getDoctorProfileService(parsedId.data);

        res.status(200).json({
            success: true,
            message: "Doctor profile retrieved successfully.",
            data: profile,
        });
    } catch (error) {
        handleServiceError(error, res, "getDoctorProfileController");
    }
};

// ─── Upsert Doctor Profile ────────────────────────────────────────────────────

export const upsertDoctorProfileController = async (
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

        const parsed = upsertDoctorProfileSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const { userId: requesterId, role: requesterRole } = req.user!;

        const profile = await upsertDoctorProfileService(
            parsedId.data,
            parsed.data,
            requesterId,
            requesterRole as Role,
        );

        res.status(200).json({
            success: true,
            message: "Doctor profile saved successfully.",
            data: profile,
        });
    } catch (error) {
        handleServiceError(error, res, "upsertDoctorProfileController");
    }
};

// ─── List Doctor Services ─────────────────────────────────────────────────────

export const listDoctorServicesController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedId = userIdParamSchema.safeParse(req.params.doctorId);

        if (!parsedId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid doctor ID.",
                errors: parsedId.error.flatten(),
            });
            return;
        }

        const services = await listDoctorServicesService(parsedId.data);

        res.status(200).json({
            success: true,
            message: "Doctor services retrieved successfully.",
            data: services,
        });
    } catch (error) {
        handleServiceError(error, res, "listDoctorServicesController");
    }
};

// ─── Add Doctor Service ───────────────────────────────────────────────────────

export const addDoctorServiceController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedId = userIdParamSchema.safeParse(req.params.doctorId);

        if (!parsedId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid doctor ID.",
                errors: parsedId.error.flatten(),
            });
            return;
        }

        const parsed = createDoctorServiceSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const { userId: requesterId, role: requesterRole } = req.user!;

        const service = await addDoctorServiceService(
            parsedId.data,
            parsed.data,
            requesterId,
            requesterRole as Role,
        );

        res.status(201).json({
            success: true,
            message: "Doctor service added successfully.",
            data: service,
        });
    } catch (error) {
        handleServiceError(error, res, "addDoctorServiceController");
    }
};

// ─── Update Doctor Service ────────────────────────────────────────────────────

export const updateDoctorServiceController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedDoctorId = userIdParamSchema.safeParse(req.params.doctorId);
        const parsedServiceId = serviceIdParamSchema.safeParse(
            req.params.serviceId,
        );

        if (!parsedDoctorId.success || !parsedServiceId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid doctor ID or service ID.",
            });
            return;
        }

        const parsed = updateDoctorServiceSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const { userId: requesterId, role: requesterRole } = req.user!;

        const service = await updateDoctorServiceService(
            parsedDoctorId.data,
            parsedServiceId.data,
            parsed.data,
            requesterId,
            requesterRole as Role,
        );

        res.status(200).json({
            success: true,
            message: "Doctor service updated successfully.",
            data: service,
        });
    } catch (error) {
        handleServiceError(error, res, "updateDoctorServiceController");
    }
};

// ─── Delete Doctor Service ────────────────────────────────────────────────────

export const deleteDoctorServiceController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedDoctorId = userIdParamSchema.safeParse(req.params.doctorId);
        const parsedServiceId = serviceIdParamSchema.safeParse(
            req.params.serviceId,
        );

        if (!parsedDoctorId.success || !parsedServiceId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid doctor ID or service ID.",
            });
            return;
        }

        const { userId: requesterId, role: requesterRole } = req.user!;

        const result = await deleteDoctorServiceService(
            parsedDoctorId.data,
            parsedServiceId.data,
            requesterId,
            requesterRole as Role,
        );

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        handleServiceError(error, res, "deleteDoctorServiceController");
    }
};
