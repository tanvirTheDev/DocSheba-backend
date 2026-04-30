/** @format */

import { AccountStatus, Prisma, Role } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { ListUsersInput, UpdateUserInput, ChangeStatusInput } from "./schema";

// ─── Shared Select ────────────────────────────────────────────────────────────

const userSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    verified: true,
    status: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.UserSelect;

// ─── List Users ───────────────────────────────────────────────────────────────

export const listUsersService = async (filters: ListUsersInput) => {
    const { page, limit, role, status, search } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
        ...(role && { role }),
        ...(status && { status }),
        ...(search && {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
            ],
        }),
    };

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            select: userSelect,
        }),
        prisma.user.count({ where }),
    ]);

    return {
        users,
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

// ─── Get User By ID ───────────────────────────────────────────────────────────

export const getUserByIdService = async (id: string) => {
    const user = await prisma.user.findUnique({
        where: { id },
        select: userSelect,
    });

    if (!user) throw new Error("USER_NOT_FOUND");

    return user;
};

// ─── Update User ──────────────────────────────────────────────────────────────

export const updateUserService = async (id: string, data: UpdateUserInput) => {
    const exists = await prisma.user.findUnique({
        where: { id },
        select: { id: true },
    });

    if (!exists) throw new Error("USER_NOT_FOUND");

    return prisma.user.update({
        where: { id },
        data,
        select: userSelect,
    });
};

// ─── Change Account Status (Admin) ────────────────────────────────────────────

export const changeUserStatusService = async (
    id: string,
    data: ChangeStatusInput,
) => {
    const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, status: true, role: true },
    });

    if (!user) throw new Error("USER_NOT_FOUND");

    // Cannot change status of a SUPER_ADMIN
    if (user.role === Role.SUPER_ADMIN)
        throw new Error("CANNOT_MODIFY_SUPER_ADMIN");

    // No-op guard
    if (user.status === data.status) throw new Error("STATUS_ALREADY_SET");

    return prisma.user.update({
        where: { id },
        data: { status: data.status },
        select: userSelect,
    });
};

// ─── Deactivate User (Soft Delete) ───────────────────────────────────────────

export const deactivateUserService = async (
    id: string,
    requesterId: string,
    requesterRole: Role,
) => {
    const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, status: true, role: true },
    });

    if (!user) throw new Error("USER_NOT_FOUND");

    // Only SUPER_ADMIN can deactivate another SUPER_ADMIN
    if (user.role === Role.SUPER_ADMIN && requesterRole !== Role.SUPER_ADMIN)
        throw new Error("CANNOT_MODIFY_SUPER_ADMIN");

    // Cannot deactivate yourself
    if (id === requesterId) throw new Error("CANNOT_DEACTIVATE_SELF");

    if (user.status === AccountStatus.INACTIVE)
        throw new Error("USER_ALREADY_INACTIVE");

    await prisma.user.update({
        where: { id },
        data: { status: AccountStatus.INACTIVE },
    });

    return { message: "User deactivated successfully." };
};

// modules/users/user.service.ts — add these

export const assignAssistantService = async (
    doctorId: string, // User.id of the doctor
    assistantId: string, // User.id of the assistant
) => {
    // Validate doctor exists and has role DOCTOR
    const doctor = await prisma.user.findUnique({
        where: { id: doctorId },
        select: { id: true, role: true },
    });

    if (!doctor) throw new Error("USER_NOT_FOUND");
    if (doctor.role !== Role.DOCTOR) throw new Error("TARGET_NOT_A_DOCTOR");

    // Validate assistant exists and has role DOCTOR_ASSISTANT
    const assistant = await prisma.user.findUnique({
        where: { id: assistantId },
        select: { id: true, role: true, assistantId: true },
    });

    if (!assistant) throw new Error("ASSISTANT_NOT_FOUND");
    if (assistant.role !== Role.DOCTOR_ASSISTANT)
        throw new Error("USER_NOT_AN_ASSISTANT");

    // Block if already assigned to another doctor
    if (assistant.assistantId && assistant.assistantId !== doctorId)
        throw new Error("ASSISTANT_ALREADY_ASSIGNED");

    // No-op if already assigned to this doctor
    if (assistant.assistantId === doctorId)
        throw new Error("ALREADY_ASSIGNED_TO_THIS_DOCTOR");

    return prisma.user.update({
        where: { id: assistantId },
        data: { assistantId: doctorId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            assistantId: true,
        },
    });
};

export const removeAssistantService = async (
    doctorId: string,
    assistantId: string,
) => {
    const assistant = await prisma.user.findUnique({
        where: { id: assistantId },
        select: { id: true, role: true, assistantId: true },
    });

    if (!assistant) throw new Error("ASSISTANT_NOT_FOUND");
    if (assistant.role !== Role.DOCTOR_ASSISTANT)
        throw new Error("USER_NOT_AN_ASSISTANT");

    // Only unlink if currently assigned to this doctor
    if (assistant.assistantId !== doctorId)
        throw new Error("NOT_ASSIGNED_TO_THIS_DOCTOR");

    await prisma.user.update({
        where: { id: assistantId },
        data: { assistantId: null },
    });

    return { message: "Assistant unlinked from doctor successfully." };
};

export const listAssistantsService = async (doctorId: string) => {
    const doctor = await prisma.user.findUnique({
        where: { id: doctorId },
        select: { id: true, role: true },
    });

    if (!doctor) throw new Error("USER_NOT_FOUND");
    if (doctor.role !== Role.DOCTOR) throw new Error("TARGET_NOT_A_DOCTOR");

    return prisma.user.findMany({
        where: { assistantId: doctorId },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
        },
        orderBy: { createdAt: "asc" },
    });
};
