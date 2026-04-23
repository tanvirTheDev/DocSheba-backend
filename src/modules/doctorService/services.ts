/** @format */

import { Prisma } from "../../generated/prisma/client";
import { Role } from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import {
    UpsertDoctorProfileInput,
    CreateDoctorServiceInput,
    UpdateDoctorServiceInput,
} from "./schema";

// ─── Shared Selects ───────────────────────────────────────────────────────────

const profileSelect = {
    id: true,
    userId: true,
    specialty: true,
    qualifications: true,
    licenseNo: true,
    signatureImageUrl: true,
    clinicName: true,
    clinicAddress: true,
    isAvailable: true,
    createdAt: true,
    updatedAt: true,
    user: {
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
        },
    },
} satisfies Prisma.DoctorProfileSelect;

const serviceSelect = {
    id: true,
    doctorId: true,
    serviceType: true,
    fee: true,
    duration: true,
    isActive: true,
    description: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.DoctorServiceSelect;

// ─── Internal Helpers ─────────────────────────────────────────────────────────

const assertDoctorUser = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, status: true },
    });

    if (!user) throw new Error("USER_NOT_FOUND");
    if (user.role !== Role.DOCTOR) throw new Error("USER_NOT_A_DOCTOR");

    return user;
};

const assertOwnerOrAdmin = (
    requesterId: string,
    targetId: string,
    requesterRole: Role,
) => {
    const isAdmin = ([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(
        requesterRole,
    );

    if (!isAdmin && requesterId !== targetId) throw new Error("FORBIDDEN");
};

// ══════════════════════════════════════════════════════════════════════════════
// DOCTOR PROFILE
// ══════════════════════════════════════════════════════════════════════════════

// ─── Get Doctor Profile ───────────────────────────────────────────────────────

export const getDoctorProfileService = async (userId: string) => {
    await assertDoctorUser(userId);

    const profile = await prisma.doctorProfile.findUnique({
        where: { userId },
        select: profileSelect,
    });

    if (!profile) throw new Error("PROFILE_NOT_FOUND");

    return profile;
};

// ─── Upsert Doctor Profile ────────────────────────────────────────────────────

export const upsertDoctorProfileService = async (
    userId: string,
    data: UpsertDoctorProfileInput,
    requesterId: string,
    requesterRole: Role,
) => {
    await assertDoctorUser(userId);
    assertOwnerOrAdmin(requesterId, userId, requesterRole);

    // licenseNo uniqueness — only check if provided and not null
    if (data.licenseNo) {
        const conflict = await prisma.doctorProfile.findFirst({
            where: {
                licenseNo: data.licenseNo,
                NOT: { userId },
            },
            select: { id: true },
        });

        if (conflict) throw new Error("LICENSE_NO_TAKEN");
    }

    return prisma.doctorProfile.upsert({
        where: { userId },
        create: { userId, ...data },
        update: data,
        select: profileSelect,
    });
};

// ══════════════════════════════════════════════════════════════════════════════
// DOCTOR SERVICES
// ══════════════════════════════════════════════════════════════════════════════

// ─── List Doctor Services ─────────────────────────────────────────────────────

export const listDoctorServicesService = async (doctorId: string) => {
    await assertDoctorUser(doctorId);

    return prisma.doctorService.findMany({
        where: { doctorId },
        orderBy: { createdAt: "asc" },
        select: serviceSelect,
    });
};

// ─── Add Doctor Service ───────────────────────────────────────────────────────

export const addDoctorServiceService = async (
    doctorId: string,
    data: CreateDoctorServiceInput,
    requesterId: string,
    requesterRole: Role,
) => {
    await assertDoctorUser(doctorId);
    assertOwnerOrAdmin(requesterId, doctorId, requesterRole);

    // Enforce @@unique([doctorId, serviceType])
    const existing = await prisma.doctorService.findUnique({
        where: {
            doctorId_serviceType: { doctorId, serviceType: data.serviceType },
        },
        select: { id: true },
    });

    if (existing) throw new Error("SERVICE_TYPE_DUPLICATE");

    return prisma.doctorService.create({
        data: { doctorId, ...data },
        select: serviceSelect,
    });
};

// ─── Update Doctor Service ────────────────────────────────────────────────────

export const updateDoctorServiceService = async (
    doctorId: string,
    serviceId: string,
    data: UpdateDoctorServiceInput,
    requesterId: string,
    requesterRole: Role,
) => {
    await assertDoctorUser(doctorId);
    assertOwnerOrAdmin(requesterId, doctorId, requesterRole);

    // Verify service belongs to this doctor
    const service = await prisma.doctorService.findFirst({
        where: { id: serviceId, doctorId },
        select: { id: true },
    });

    if (!service) throw new Error("SERVICE_NOT_FOUND");

    return prisma.doctorService.update({
        where: { id: serviceId },
        data,
        select: serviceSelect,
    });
};

// ─── Delete Doctor Service ────────────────────────────────────────────────────

export const deleteDoctorServiceService = async (
    doctorId: string,
    serviceId: string,
    requesterId: string,
    requesterRole: Role,
) => {
    await assertDoctorUser(doctorId);
    assertOwnerOrAdmin(requesterId, doctorId, requesterRole);

    const service = await prisma.doctorService.findFirst({
        where: { id: serviceId, doctorId },
        select: { id: true, _count: { select: { appointments: true } } },
    });

    if (!service) throw new Error("SERVICE_NOT_FOUND");

    // Block hard delete if linked appointments exist
    if (service._count.appointments > 0)
        throw new Error("SERVICE_HAS_APPOINTMENTS");

    await prisma.doctorService.delete({ where: { id: serviceId } });

    return { message: "Service removed successfully." };
};
