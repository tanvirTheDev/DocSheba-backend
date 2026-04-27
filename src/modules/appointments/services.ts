/** @format */

import {
    Role,
    AppointmentStatus,
    ServiceType,
} from "../../generated/prisma/enums";
import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { v4 as uuidv4 } from "uuid";
import {
    ListAppointmentsInput,
    CreateAppointmentInput,
    UpdateAppointmentInput,
} from "./schema";

// ─── Shared Select ────────────────────────────────────────────────────────────

const appointmentSelect = {
    id: true,
    patientId: true,
    doctorId: true,
    bookedById: true,
    serviceId: true,
    serviceType: true,
    serialNo: true,
    fee: true,
    status: true,
    paymentMethod: true,
    paymentStatus: true,
    appointmentDate: true,
    location: true,
    chiefComplaint: true,
    notes: true,
    callRoomId: true,
    callStartedAt: true,
    callEndedAt: true,
    callDurationMin: true,
    callRecordingUrl: true,
    createdAt: true,
    updatedAt: true,
    patient: {
        select: { id: true, name: true, email: true, phone: true },
    },
    doctor: {
        select: {
            id: true,
            name: true,
            doctorProfile: {
                select: { specialty: true, clinicName: true },
            },
        },
    },
    bookedBy: {
        select: { id: true, name: true, role: true },
    },
    service: {
        select: { id: true, serviceType: true, fee: true, duration: true },
    },
} satisfies Prisma.AppointmentSelect;

// ─── Internal Helpers ─────────────────────────────────────────────────────────

// Auto-increment serial number per doctor per day
const getNextSerialNo = async (
    doctorId: string,
    date: Date,
    tx: Prisma.TransactionClient,
): Promise<number> => {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    const serial = await tx.appointmentSerial.upsert({
        where: { doctorId_serialDate: { doctorId, serialDate: dateOnly } },
        create: { doctorId, serialDate: dateOnly, lastSerial: 1 },
        update: { lastSerial: { increment: 1 } },
        select: { lastSerial: true },
    });

    return serial.lastSerial;
};

// Calculate commission for a referral agent
const calculateCommission = (
    fee: number,
    commissionType: string,
    commissionValue: number | null,
): number => {
    if (!commissionValue) return 0;
    if (commissionType === "PERCENTAGE") return (fee * commissionValue) / 100;
    if (commissionType === "FLAT") return commissionValue;
    return 0;
};

// ─── List Appointments ────────────────────────────────────────────────────────

export const listAppointmentsService = async (
    filters: ListAppointmentsInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const { page, limit, doctorId, patientId, status, serviceType, date } =
        filters;
    const skip = (page - 1) * limit;

    // ── Role-based scope ──────────────────────────────────────────────────────
    let scopeFilter: Prisma.AppointmentWhereInput = {};

    switch (requesterRole) {
        case Role.PATIENT:
            scopeFilter = { patientId: requesterId };
            break;
        case Role.DOCTOR:
            scopeFilter = { doctorId: requesterId };
            break;
        case Role.DOCTOR_ASSISTANT:
            // Assistant sees appointments for their doctor
            const assistant = await prisma.user.findUnique({
                where: { id: requesterId },
                select: { assistantId: true },
            });
            scopeFilter = assistant?.assistantId
                ? { doctorId: assistant.assistantId }
                : { doctorId: requesterId };
            break;
        case Role.ADMIN:
        case Role.SUPER_ADMIN:
            // Admins see all — apply optional filters
            if (doctorId) scopeFilter = { ...scopeFilter, doctorId };
            if (patientId) scopeFilter = { ...scopeFilter, patientId };
            break;
    }

    // ── Date filter ───────────────────────────────────────────────────────────
    let dateFilter: Prisma.AppointmentWhereInput = {};
    if (date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        dateFilter = { appointmentDate: { gte: start, lte: end } };
    }

    const where: Prisma.AppointmentWhereInput = {
        ...scopeFilter,
        ...dateFilter,
        ...(status && { status }),
        ...(serviceType && { serviceType }),
    };

    const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
            where,
            skip,
            take: limit,
            orderBy: { appointmentDate: "desc" },
            select: appointmentSelect,
        }),
        prisma.appointment.count({ where }),
    ]);

    return {
        appointments,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1,
        },
    };
};

// ─── Get Appointment By ID ────────────────────────────────────────────────────

export const getAppointmentByIdService = async (
    id: string,
    requesterId: string,
    requesterRole: Role,
) => {
    const appointment = await prisma.appointment.findUnique({
        where: { id },
        select: appointmentSelect,
    });

    if (!appointment) throw new Error("APPOINTMENT_NOT_FOUND");

    // Scope check — patients and doctors can only view their own
    const isAdmin = ([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(
        requesterRole,
    );
    const isOwner =
        appointment.patientId === requesterId ||
        appointment.doctorId === requesterId ||
        appointment.bookedById === requesterId;

    if (!isAdmin && !isOwner) throw new Error("FORBIDDEN");

    return appointment;
};

// ─── Create Appointment ───────────────────────────────────────────────────────

export const createAppointmentService = async (
    data: CreateAppointmentInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const {
        patientId,
        doctorId,
        serviceId,
        serviceType,
        fee,
        paymentMethod,
        appointmentDate,
        location,
        chiefComplaint,
        notes,
        referralAgentId,
    } = data;

    // ── Validate patient ──────────────────────────────────────────────────────
    const patient = await prisma.user.findUnique({
        where: { id: patientId },
        select: { id: true, role: true },
    });
    if (!patient || patient.role !== Role.PATIENT)
        throw new Error("PATIENT_NOT_FOUND");

    // ── Validate doctor ───────────────────────────────────────────────────────
    const doctor = await prisma.user.findUnique({
        where: { id: doctorId },
        select: {
            id: true,
            role: true,
            doctorProfile: { select: { isAvailable: true } },
        },
    });
    if (!doctor || doctor.role !== Role.DOCTOR)
        throw new Error("DOCTOR_NOT_FOUND");

    if (!doctor.doctorProfile?.isAvailable)
        throw new Error("DOCTOR_NOT_AVAILABLE");

    // ── Resolve fee , serviceType and location from DoctorService if serviceId given ─────
    let resolvedFee = fee;
    let resolvedServiceType = serviceType;
    let visitLocation = null;

    if (serviceId) {
        const service = await prisma.doctorService.findFirst({
            where: { id: serviceId, doctorId, isActive: true },
            select: { fee: true, serviceType: true },
        });
        if (!service) throw new Error("SERVICE_NOT_FOUND");

        resolvedFee = Number(service.fee);
        resolvedServiceType = service.serviceType;
        if (service.serviceType === ServiceType.HOME_VISIT) {
            visitLocation = location;  
        }
    }

    // ── Validate referral agent if provided ───────────────────────────────────
    let referralAgent = null;
    if (referralAgentId) {
        referralAgent = await prisma.referralAgent.findUnique({
            where: { id: referralAgentId },
            select: {
                id: true,
                isActive: true,
                commissionType: true,
                commissionValue: true,
            },
        });
        if (!referralAgent || !referralAgent.isActive)
            throw new Error("REFERRAL_AGENT_NOT_FOUND");
    }

    // ── Create inside transaction ─────────────────────────────────────────────
    return prisma.$transaction(async (tx) => {
        const serialNo = await getNextSerialNo(doctorId, appointmentDate, tx);

        const appointment = await tx.appointment.create({
            data: {
                patientId,
                doctorId,
                bookedById: requesterId,
                serviceId: serviceId ?? null,
                serviceType: resolvedServiceType,
                fee: resolvedFee,
                paymentMethod,
                appointmentDate,
                serialNo,
                location: visitLocation ?? null,
                chiefComplaint: chiefComplaint ?? null,
                notes: notes ?? null,
                status: AppointmentStatus.PENDING,
            },
            select: appointmentSelect,
        });

        // ── Create referral record if agent provided ──────────────────────────
        if (referralAgent) {
            const commissionEarned = calculateCommission(
                resolvedFee,
                referralAgent.commissionType,
                referralAgent.commissionValue
                    ? Number(referralAgent.commissionValue)
                    : null,
            );

            await tx.referral.create({
                data: {
                    agentId: referralAgent.id,
                    appointmentId: appointment.id,
                    commissionType: referralAgent.commissionType,
                    commissionValue: referralAgent.commissionValue,
                    commissionEarned,
                },
            });
        }

        return appointment;
    });
};

// ─── Update Appointment ───────────────────────────────────────────────────────

export const updateAppointmentService = async (
    id: string,
    data: UpdateAppointmentInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const appointment = await prisma.appointment.findUnique({
        where: { id },
        select: { id: true, patientId: true, doctorId: true, status: true },
    });

    if (!appointment) throw new Error("APPOINTMENT_NOT_FOUND");

    // Block updates on cancelled or completed appointments
    if (appointment.status === AppointmentStatus.CANCELLED)
        throw new Error("APPOINTMENT_CANCELLED");

    if (appointment.status === AppointmentStatus.COMPLETED)
        throw new Error("APPOINTMENT_COMPLETED");

    // Only doctor, admin, or assistant can update
    const isAdmin = ([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(
        requesterRole,
    );
    const isDoctor =
        requesterRole === Role.DOCTOR && appointment.doctorId === requesterId;
    const isAssistant = requesterRole === Role.DOCTOR_ASSISTANT;

    if (!isAdmin && !isDoctor && !isAssistant) throw new Error("FORBIDDEN");

    // Calculate callDurationMin if both timestamps are present
    let callDurationMin: number | undefined;
    if (data.callEndedAt && data.callStartedAt) {
        const diffMs =
            data.callEndedAt.getTime() - data.callStartedAt.getTime();
        callDurationMin = Math.round(diffMs / 60000);
    }

    return prisma.appointment.update({
        where: { id },
        data: {
            ...data,
            ...(callDurationMin !== undefined && { callDurationMin }),
        },
        select: appointmentSelect,
    });
};

// ─── Cancel Appointment ───────────────────────────────────────────────────────

export const cancelAppointmentService = async (
    id: string,
    requesterId: string,
    requesterRole: Role,
) => {
    const appointment = await prisma.appointment.findUnique({
        where: { id },
        select: { id: true, patientId: true, doctorId: true, status: true },
    });

    if (!appointment) throw new Error("APPOINTMENT_NOT_FOUND");

    if (appointment.status === AppointmentStatus.CANCELLED)
        throw new Error("APPOINTMENT_ALREADY_CANCELLED");

    if (appointment.status === AppointmentStatus.COMPLETED)
        throw new Error("APPOINTMENT_COMPLETED");

    // Patients can cancel their own; doctors, assistants, admins can cancel any
    const isAdmin = ([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(
        requesterRole,
    );
    const isPatient =
        requesterRole === Role.PATIENT && appointment.patientId === requesterId;
    const isDoctor =
        requesterRole === Role.DOCTOR && appointment.doctorId === requesterId;
    const isAssistant = requesterRole === Role.DOCTOR_ASSISTANT;

    if (!isAdmin && !isPatient && !isDoctor && !isAssistant)
        throw new Error("FORBIDDEN");

    await prisma.appointment.update({
        where: { id },
        data: { status: AppointmentStatus.CANCELLED },
    });

    return { message: "Appointment cancelled successfully." };
};

// ─── Start Call ───────────────────────────────────────────────────────────────

export const startCallService = async (
    id: string,
    requesterId: string,
    requesterRole: Role,
) => {
    const appointment = await prisma.appointment.findUnique({
        where: { id },
        select: {
            id: true,
            doctorId: true,
            serviceType: true,
            status: true,
            callRoomId: true,
        },
    });

    if (!appointment) throw new Error("APPOINTMENT_NOT_FOUND");

    // Only VIDEO_CALL or AUDIO_CALL appointments can start a call
    const callTypes: ServiceType[] = [
        ServiceType.VIDEO_CALL,
        ServiceType.AUDIO_CALL,
    ];
    if (!callTypes.includes(appointment.serviceType))
        throw new Error("NOT_A_CALL_APPOINTMENT");

    if (appointment.status !== AppointmentStatus.CONFIRMED)
        throw new Error("APPOINTMENT_NOT_CONFIRMED");

    // Only the doctor or admin can start a call
    const isAdmin = ([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(
        requesterRole,
    );
    const isDoctor =
        requesterRole === Role.DOCTOR && appointment.doctorId === requesterId;

    if (!isAdmin && !isDoctor) throw new Error("FORBIDDEN");

    const callRoomId = appointment.callRoomId ?? `room-${uuidv4()}`;
    const callStartedAt = new Date();

    const updated = await prisma.appointment.update({
        where: { id },
        data: {
            callRoomId,
            callStartedAt,
            status: AppointmentStatus.IN_PROGRESS,
        },
        select: { id: true, callRoomId: true, callStartedAt: true },
    });

    return updated;
};

// ─── End Call ─────────────────────────────────────────────────────────────────

export const endCallService = async (
    id: string,
    requesterId: string,
    requesterRole: Role,
) => {
    const appointment = await prisma.appointment.findUnique({
        where: { id },
        select: {
            id: true,
            doctorId: true,
            serviceType: true,
            status: true,
            callStartedAt: true,
        },
    });

    if (!appointment) throw new Error("APPOINTMENT_NOT_FOUND");

    if (appointment.status !== AppointmentStatus.IN_PROGRESS)
        throw new Error("CALL_NOT_IN_PROGRESS");

    const isAdmin = ([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(
        requesterRole,
    );
    const isDoctor =
        requesterRole === Role.DOCTOR && appointment.doctorId === requesterId;

    if (!isAdmin && !isDoctor) throw new Error("FORBIDDEN");

    const callEndedAt = new Date();
    const callDurationMin = appointment.callStartedAt
        ? Math.round(
              (callEndedAt.getTime() - appointment.callStartedAt.getTime()) /
                  60000,
          )
        : null;

    return prisma.appointment.update({
        where: { id },
        data: {
            callEndedAt,
            callDurationMin,
            status: AppointmentStatus.COMPLETED,
        },
        select: appointmentSelect,
    });
};
