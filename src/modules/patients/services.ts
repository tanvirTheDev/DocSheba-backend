/** @format */

import { Role } from "../../generated/prisma/enums";
import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { UpsertPatientProfileInput } from "./schema";

// ─── Shared Select ────────────────────────────────────────────────────────────

const profileSelect = {
    id: true,
    userId: true,
    regNo: true,
    dateOfBirth: true,
    sex: true,
    bloodGroup: true,
    address: true,
    weightKg: true,
    heightCm: true,
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
} satisfies Prisma.PatientProfileSelect;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const assertPatientExists = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
    });

    if (!user) throw new Error("USER_NOT_FOUND");
    if (user.role !== Role.PATIENT) throw new Error("USER_NOT_A_PATIENT");

    return user;
};

// Auto-generate registration number: PAT-YYYYMMDD-XXXX
const generateRegNo = async (): Promise<string> => {
    const today = new Date();
    const prefix = `PAT-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;

    const last = await prisma.patientProfile.findFirst({
        where: { regNo: { startsWith: prefix } },
        orderBy: { createdAt: "desc" },
        select: { regNo: true },
    });

    const lastSeq = last?.regNo
        ? parseInt(last.regNo.split("-")[2] ?? "0", 10)
        : 0;

    const seq = String(lastSeq + 1).padStart(4, "0");
    return `${prefix}-${seq}`;
};

// ─── Get Patient Profile ──────────────────────────────────────────────────────

export const getPatientProfileService = async (
    userId: string,
    requesterId: string,
    requesterRole: Role,
) => {
    await assertPatientExists(userId);

    // Patients can only view their own profile
    // Doctors, Assistants, Admins can view any patient
    const canView = [
        Role.PATIENT,
        Role.DOCTOR,
        Role.DOCTOR_ASSISTANT,
        Role.ADMIN,
        Role.SUPER_ADMIN,
    ].includes(requesterRole);

    if (!canView && requesterId !== userId) throw new Error("FORBIDDEN");

    const profile = await prisma.patientProfile.findUnique({
        where: { userId },
        select: profileSelect,
    });

    if (!profile) throw new Error("PROFILE_NOT_FOUND");

    return profile;
};

// ─── Upsert Patient Profile ───────────────────────────────────────────────────

export const upsertPatientProfileService = async (
    userId: string,
    data: UpsertPatientProfileInput,
    requesterId: string,
    requesterRole: Role,
) => {
    await assertPatientExists(userId);

    // Patients can only upsert their own profile
    const canManage = ([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(
        requesterRole,
    );
    if (!canManage && requesterId !== userId) throw new Error("FORBIDDEN");

    // Check if profile already exists to decide whether to generate regNo
    const existing = await prisma.patientProfile.findUnique({
        where: { userId },
        select: { id: true, regNo: true },
    });

    const regNo = existing?.regNo ?? (await generateRegNo());

    return prisma.patientProfile.upsert({
        where: { userId },
        create: {
            userId,
            regNo,
            ...data,
        },
        update: data,
        select: profileSelect,
    });
};
