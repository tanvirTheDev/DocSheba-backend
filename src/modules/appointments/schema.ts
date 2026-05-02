/** @format */

import { z } from "zod";
import {
    AppointmentStatus,
    ServiceType,
    PaymentMethod,
} from "../../generated/prisma/enums";

// ─── Params ───────────────────────────────────────────────────────────────────

export const appointmentIdSchema = z.string().cuid("Invalid appointment ID.");

// ─── List Appointments ────────────────────────────────────────────────────────

export const listAppointmentsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    doctorId: z.string().cuid("Invalid doctor ID.").optional(),
    patientId: z.string().cuid("Invalid patient ID.").optional(),
    status: z.nativeEnum(AppointmentStatus).optional(),
    serviceType: z.nativeEnum(ServiceType).optional(),
    date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format.")
        .optional(),
});

export type ListAppointmentsInput = z.infer<typeof listAppointmentsSchema>;

// ─── Create Appointment ───────────────────────────────────────────────────────

export const createAppointmentSchema = z
    .object({
        patientId: z.string().cuid("Invalid patient ID."),
        doctorId: z.string().cuid("Invalid doctor ID."),
        serviceId: z.string().cuid("Invalid service ID.").optional(),
        serviceType: z.nativeEnum(ServiceType, {
            errorMap: () => ({ message: "Invalid service type." }),
        }),
        fee: z.coerce
            .number()
            .int("Fee must be a whole number.")
            .positive("Fee must be a positive number."),
        paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
        appointmentDate: z.coerce
            .date()
            .min(new Date(), "Appointment date cannot be in the past."),
        location: z.string().trim().max(200).optional().nullable(),
        chiefComplaint: z.string().trim().max(500).optional().nullable(),
        notes: z.string().trim().max(1000).optional().nullable(),
        referralAgentId: z
            .string()
            .cuid("Invalid referral agent ID.")
            .optional()
            .nullable(),
        isFollowUp: z.coerce.boolean().default(false),
        previousApptId: z
            .string()
            .cuid("Invalid appointment ID.")
            .optional()
            .nullable(),
    })
    .refine((data) => !data.isFollowUp || !!data.previousApptId, {
        message: "previousApptId is required when isFollowUp is true.",
        path: ["previousApptId"],
    });

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

// ─── Update Appointment ───────────────────────────────────────────────────────

export const updateAppointmentSchema = z
    .object({
        status: z.nativeEnum(AppointmentStatus).optional(),
        appointmentDate: z.coerce.date().optional(),
        location: z.string().trim().max(200).optional().nullable(),
        chiefComplaint: z.string().trim().max(500).optional().nullable(),
        notes: z.string().trim().max(1000).optional().nullable(),
        paymentMethod: z.nativeEnum(PaymentMethod).optional(),
        paymentStatus: z.coerce.boolean().optional(),
        callRoomId: z.string().trim().optional().nullable(),
        callStartedAt: z.coerce.date().optional().nullable(),
        callEndedAt: z.coerce.date().optional().nullable(),
        callRecordingUrl: z
            .string()
            .url("Invalid recording URL.")
            .optional()
            .nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update.",
    })
    .refine(
        (data) =>
            !data.callEndedAt ||
            !data.callStartedAt ||
            data.callEndedAt > data.callStartedAt,
        {
            message: "callEndedAt must be after callStartedAt.",
            path: ["callEndedAt"],
        },
    );

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
