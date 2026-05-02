/** @format */

import { Role } from "../../generated/prisma/enums";
import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import {
    UpsertDoctorProfileInput,
    CreateDoctorServiceInput,
    UpdateDoctorServiceInput,
} from "./schema";
import { uploadToCloudinary } from "../../utils/cloudinay";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const assertDoctorExists = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
    });

    if (!user) throw new Error("USER_NOT_FOUND");
    if (user.role !== Role.DOCTOR) throw new Error("USER_NOT_A_DOCTOR");

    return user;
};

// ─── Get Doctor Profile ───────────────────────────────────────────────────────

export const getDoctorProfileService = async (userId: string) => {
    await assertDoctorExists(userId);

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
    files?: {
        profileImage?: Express.Multer.File;
        coverImage?: Express.Multer.File;
        signatureImage?: Express.Multer.File;
    },
) => {
    await assertDoctorExists(userId);

    if (
        requesterId !== userId &&
        requesterRole !== Role.ADMIN &&
        requesterRole !== Role.SUPER_ADMIN
    )
        throw new Error("FORBIDDEN");

    if (data.licenseNo) {
        const conflict = await prisma.doctorProfile.findFirst({
            where: { licenseNo: data.licenseNo, NOT: { userId } },
            select: { id: true },
        });
        if (conflict) throw new Error("LICENSE_NO_TAKEN");
    }

    const [profileImageUrl, coverImageUrl, signatureImageUrl] =
        await Promise.all([
            files?.profileImage
                ? uploadToCloudinary(
                      files.profileImage.buffer,
                      "doctor-profiles",
                      `${userId}-profile`,
                  )
                : Promise.resolve(undefined),

            files?.coverImage
                ? uploadToCloudinary(
                      files.coverImage.buffer,
                      "doctor-covers",
                      `${userId}-cover`,
                  )
                : Promise.resolve(undefined),

            files?.signatureImage
                ? uploadToCloudinary(
                      files.signatureImage.buffer,
                      "doctor-signatures",
                      `${userId}-signature`,
                  )
                : Promise.resolve(undefined),
        ]);

    const imagePatch: Partial<{
        profileImageUrl: string;
        coverImageUrl: string;
        signatureImageUrl: string;
    }> = {};

    if (profileImageUrl !== undefined)
        imagePatch.profileImageUrl = profileImageUrl;
    if (coverImageUrl !== undefined) imagePatch.coverImageUrl = coverImageUrl;
    if (signatureImageUrl !== undefined)
        imagePatch.signatureImageUrl = signatureImageUrl;

    const payload = { ...data, ...imagePatch };

    return prisma.doctorProfile.upsert({
        where: { userId },
        create: { userId, ...payload },
        update: payload,
        select: profileSelect,
    });
};

// ─── List Doctor Services ─────────────────────────────────────────────────────

export const listDoctorServicesService = async (doctorId: string) => {
    await assertDoctorExists(doctorId);

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
    await assertDoctorExists(doctorId);

    // Only the doctor themselves or an admin can add a service
    if (
        requesterId !== doctorId &&
        requesterRole !== Role.DOCTOR &&
        requesterRole !== Role.ADMIN &&
        requesterRole !== Role.SUPER_ADMIN
    )
        throw new Error("FORBIDDEN");

    // Enforce unique serviceType per doctor (@@unique([doctorId, serviceType]))
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
    await assertDoctorExists(doctorId);

    if (
        requesterId !== doctorId &&
        requesterRole !== Role.ADMIN &&
        requesterRole !== Role.SUPER_ADMIN
    )
        throw new Error("FORBIDDEN");

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
    await assertDoctorExists(doctorId);

    if (
        requesterId !== doctorId &&
        requesterRole !== Role.ADMIN &&
        requesterRole !== Role.SUPER_ADMIN
    )
        throw new Error("FORBIDDEN");

    const service = await prisma.doctorService.findFirst({
        where: { id: serviceId, doctorId },
        select: { id: true, _count: { select: { appointments: true } } },
    });

    if (!service) throw new Error("SERVICE_NOT_FOUND");

    // Block hard delete if appointments exist — soft deactivate instead
    if (service._count.appointments > 0)
        throw new Error("SERVICE_HAS_APPOINTMENTS");

    await prisma.doctorService.delete({ where: { id: serviceId } });

    return { message: "Service removed successfully." };
};
