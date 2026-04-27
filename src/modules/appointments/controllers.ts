/** @format */

import { Request, Response } from "express";
import {
    appointmentIdSchema,
    listAppointmentsSchema,
    createAppointmentSchema,
    updateAppointmentSchema,
} from "./schema";
import {
    listAppointmentsService,
    getAppointmentByIdService,
    createAppointmentService,
    updateAppointmentService,
    cancelAppointmentService,
    startCallService,
    endCallService,
} from "./services";
import { Role } from "../../generated/prisma/enums";

// ─── Shared Error Handler ─────────────────────────────────────────────────────

const handleError = (error: unknown, res: Response, context: string): void => {
    if (error instanceof Error) {
        const map: Record<string, [number, string]> = {
            APPOINTMENT_NOT_FOUND: [404, "Appointment not found."],
            FORBIDDEN: [403, "You are not allowed to perform this action."],
            PATIENT_NOT_FOUND: [404, "Patient not found."],
            DOCTOR_NOT_FOUND: [404, "Doctor not found."],
            DOCTOR_NOT_AVAILABLE: [
                409,
                "This doctor is not currently accepting appointments.",
            ],
            SERVICE_NOT_FOUND: [
                404,
                "The selected service was not found or is inactive.",
            ],
            REFERRAL_AGENT_NOT_FOUND: [
                404,
                "Referral agent not found or inactive.",
            ],
            APPOINTMENT_CANCELLED: [
                400,
                "Cannot update a cancelled appointment.",
            ],
            APPOINTMENT_COMPLETED: [
                400,
                "Cannot update a completed appointment.",
            ],
            APPOINTMENT_ALREADY_CANCELLED: [
                400,
                "This appointment is already cancelled.",
            ],
            NOT_A_CALL_APPOINTMENT: [
                400,
                "This appointment is not a VIDEO_CALL or AUDIO_CALL type.",
            ],
            APPOINTMENT_NOT_CONFIRMED: [
                400,
                "Appointment must be CONFIRMED before starting a call.",
            ],
            CALL_NOT_IN_PROGRESS: [
                400,
                "No active call session found for this appointment.",
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

    console.error(`[${context}]`, error);
    res.status(500).json({
        success: false,
        message: "Internal server error.",
        code: 500,
    });
};

// ─── List Appointments ────────────────────────────────────────────────────────

export const listAppointmentsController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsed = listAppointmentsSchema.safeParse(req.query);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Invalid query parameters.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const { userId: requesterId, role: requesterRole } = req.user!;

        const result = await listAppointmentsService(
            parsed.data,
            requesterId,
            requesterRole as Role,
        );

        res.status(200).json({
            success: true,
            message: "Appointments retrieved successfully.",
            data: result.appointments,
            meta: result.meta,
        });
    } catch (error) {
        handleError(error, res, "listAppointmentsController");
    }
};

// ─── Get Appointment By ID ────────────────────────────────────────────────────

export const getAppointmentByIdController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedId = appointmentIdSchema.safeParse(req.params.id);

        if (!parsedId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid appointment ID.",
                errors: parsedId.error.flatten(),
            });
            return;
        }

        const { userId: requesterId, role: requesterRole } = req.user!;

        const appointment = await getAppointmentByIdService(
            parsedId.data,
            requesterId,
            requesterRole as Role,
        );

        res.status(200).json({
            success: true,
            message: "Appointment retrieved successfully.",
            data: appointment,
        });
    } catch (error) {
        handleError(error, res, "getAppointmentByIdController");
    }
};

// ─── Create Appointment ───────────────────────────────────────────────────────

export const createAppointmentController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsed = createAppointmentSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const { userId: requesterId, role: requesterRole } = req.user!;

        const appointment = await createAppointmentService(
            parsed.data,
            requesterId,
            requesterRole as Role,
        );

        res.status(201).json({
            success: true,
            message: "Appointment booked successfully.",
            data: appointment,
        });
    } catch (error) {
        handleError(error, res, "createAppointmentController");
    }
};

// ─── Update Appointment ───────────────────────────────────────────────────────

export const updateAppointmentController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedId = appointmentIdSchema.safeParse(req.params.id);

        if (!parsedId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid appointment ID.",
                errors: parsedId.error.flatten(),
            });
            return;
        }

        const parsed = updateAppointmentSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const { userId: requesterId, role: requesterRole } = req.user!;

        const appointment = await updateAppointmentService(
            parsedId.data,
            parsed.data,
            requesterId,
            requesterRole as Role,
        );

        res.status(200).json({
            success: true,
            message: "Appointment updated successfully.",
            data: appointment,
        });
    } catch (error) {
        handleError(error, res, "updateAppointmentController");
    }
};

// ─── Cancel Appointment ───────────────────────────────────────────────────────

export const cancelAppointmentController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedId = appointmentIdSchema.safeParse(req.params.id);

        if (!parsedId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid appointment ID.",
                errors: parsedId.error.flatten(),
            });
            return;
        }

        const { userId: requesterId, role: requesterRole } = req.user!;

        const result = await cancelAppointmentService(
            parsedId.data,
            requesterId,
            requesterRole as Role,
        );

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        handleError(error, res, "cancelAppointmentController");
    }
};

// ─── Start Call ───────────────────────────────────────────────────────────────

export const startCallController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedId = appointmentIdSchema.safeParse(req.params.id);

        if (!parsedId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid appointment ID.",
                errors: parsedId.error.flatten(),
            });
            return;
        }

        const { userId: requesterId, role: requesterRole } = req.user!;

        const result = await startCallService(
            parsedId.data,
            requesterId,
            requesterRole as Role,
        );

        res.status(200).json({
            success: true,
            message: "Call session started.",
            data: result,
        });
    } catch (error) {
        handleError(error, res, "startCallController");
    }
};

// ─── End Call ─────────────────────────────────────────────────────────────────

export const endCallController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedId = appointmentIdSchema.safeParse(req.params.id);

        if (!parsedId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid appointment ID.",
                errors: parsedId.error.flatten(),
            });
            return;
        }

        const { userId: requesterId, role: requesterRole } = req.user!;

        const appointment = await endCallService(
            parsedId.data,
            requesterId,
            requesterRole as Role,
        );

        res.status(200).json({
            success: true,
            message: "Call session ended.",
            data: appointment,
        });
    } catch (error) {
        handleError(error, res, "endCallController");
    }
};
