/** @format */

import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import type { CreateSaasPlanInput, UpdateSaasPlanInput } from "./schema";
// ─── Shared Select ────────────────────────────────────────────────────────────

export const planSelect = {
    id: true,
    name: true,
    tier: true,
    monthlyPrice: true,
    yearlyPrice: true,
    maxDoctors: true,
    maxPatients: true,
    maxStorageGb: true,
    maxAppointments: true,
    features: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    _count: {
        select: { subscriptions: true },
    },
} satisfies Prisma.SaasPlanSelect;

// ─── SaaS Plan Service ────────────────────────────────────────────────────────

export const SaasPlanService = {
    async listPlans(onlyActive = false) {
        return prisma.saasPlan.findMany({
            where: onlyActive ? { isActive: true } : {},
            orderBy: { createdAt: "asc" },
            select: planSelect,
        });
    },

    async getPlanById(id: string) {
        const plan = await prisma.saasPlan.findUnique({
            where: { id },
            select: planSelect,
        });

        if (!plan) throw new Error("PLAN_NOT_FOUND");
        return plan;
    },

    async createPlan(data: CreateSaasPlanInput) {
        const existing = await prisma.saasPlan.findUnique({
            where: { name: data.name },
            select: { id: true },
        });

        if (existing) throw new Error("PLAN_NAME_TAKEN");

        return prisma.saasPlan.create({
            data: {
                name: data.name,
                tier: data.tier,
                monthlyPrice: data.monthlyPrice,
                yearlyPrice: data.yearlyPrice,
                maxDoctors: data.maxDoctors,
                maxPatients: data.maxPatients,
                maxStorageGb: data.maxStorageGb,
                maxAppointments: data.maxAppointments,
                features: data.features as Prisma.InputJsonValue,
                isActive: data.isActive,
            },
            select: planSelect,
        });
    },

    async updatePlan(id: string, data: UpdateSaasPlanInput) {
        const plan = await prisma.saasPlan.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!plan) throw new Error("PLAN_NOT_FOUND");

        const { features, ...rest } = data;

        return prisma.saasPlan.update({
            where: { id },
            data: {
                ...rest,
                ...(features && {
                    features: features as Prisma.InputJsonValue,
                }),
            },
            select: planSelect,
        });
    },

    async deactivatePlan(id: string) {
        const plan = await prisma.saasPlan.findUnique({
            where: { id },
            select: {
                id: true,
                isActive: true,
                _count: { select: { subscriptions: true } },
            },
        });

        if (!plan) throw new Error("PLAN_NOT_FOUND");

        // Warn if active subscriptions exist — don't hard block but flag it
        if (plan._count.subscriptions > 0)
            throw new Error("PLAN_HAS_ACTIVE_SUBSCRIPTIONS");

        return prisma.saasPlan.update({
            where: { id },
            data: { isActive: false },
            select: planSelect,
        });
    },
};
// saas.service.ts

export const createSaasPlanService = async (data: CreateSaasPlanInput) => {
    const existing = await prisma.saasPlan.findUnique({
        where: { name: data.name },
        select: { id: true },
    });

    if (existing) throw new Error("PLAN_NAME_TAKEN");

    return prisma.saasPlan.create({
        data: {
            name: data.name,
            tier: data.tier,
            monthlyPrice: data.monthlyPrice,
            yearlyPrice: data.yearlyPrice,
            maxDoctors: data.maxDoctors,
            maxPatients: data.maxPatients,
            maxStorageGb: data.maxStorageGb,
            maxAppointments: data.maxAppointments,
            features: data.features as Prisma.InputJsonValue, // ✅ cast here
            isActive: data.isActive,
        },
        select: planSelect,
    });
};

export const updateSaasPlanService = async (
    id: string,
    data: UpdateSaasPlanInput,
) => {
    const plan = await prisma.saasPlan.findUnique({
        where: { id },
        select: { id: true },
    });

    if (!plan) throw new Error("PLAN_NOT_FOUND");

    const { features, ...rest } = data;

    return prisma.saasPlan.update({
        where: { id },
        data: {
            ...rest,
            ...(features && {
                features: features as Prisma.InputJsonValue, // ✅ cast here
            }),
        },
        select: planSelect,
    });
};
