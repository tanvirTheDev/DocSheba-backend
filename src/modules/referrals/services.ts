/** @format */

import { CommissionType } from "../../generated/prisma/enums";
import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import {
    ListAgentsInput,
    CreateAgentInput,
    UpdateAgentInput,
    ListReferralsInput,
    CreateReferralInput,
    MarkPaidInput,
} from "./schema";

// ─── Shared Selects ───────────────────────────────────────────────────────────

const agentSelect = {
    id: true,
    name: true,
    phone: true,
    email: true,
    organization: true,
    agentType: true,
    commissionType: true,
    commissionValue: true,
    isActive: true,
    notes: true,
    createdAt: true,
    updatedAt: true,
    _count: {
        select: { referrals: true },
    },
} satisfies Prisma.ReferralAgentSelect;

const referralSelect = {
    id: true,
    agentId: true,
    appointmentId: true,
    commissionType: true,
    commissionValue: true,
    commissionEarned: true,
    isPaid: true,
    paidAt: true,
    notes: true,
    createdAt: true,
    agent: {
        select: {
            id: true,
            name: true,
            phone: true,
            agentType: true,
            commissionType: true,
        },
    },
    appointment: {
        select: {
            id: true,
            appointmentDate: true,
            serviceType: true,
            fee: true,
            doctor: {
                select: { id: true, name: true },
            },
            patient: {
                select: { id: true, name: true },
            },
        },
    },
} satisfies Prisma.ReferralSelect;

// ─── Commission Calculator ────────────────────────────────────────────────────

const calcCommission = (
    fee: number,
    commissionType: CommissionType,
    commissionValue: number | null,
): number => {
    if (!commissionValue || commissionType === CommissionType.NONE) return 0;
    if (commissionType === CommissionType.PERCENTAGE)
        return parseFloat(((fee * commissionValue) / 100).toFixed(2));
    if (commissionType === CommissionType.FLAT)
        return parseFloat(commissionValue.toFixed(2));
    return 0;
};

// ══════════════════════════════════════════════════════════════════════════════
// REFERRAL AGENT
// ══════════════════════════════════════════════════════════════════════════════

export const listAgentsService = async (filters: ListAgentsInput) => {
    const { page, limit, agentType, isActive } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ReferralAgentWhereInput = {
        ...(agentType !== undefined && { agentType }),
        ...(isActive !== undefined && { isActive }),
    };

    const [agents, total] = await Promise.all([
        prisma.referralAgent.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            select: agentSelect,
        }),
        prisma.referralAgent.count({ where }),
    ]);

    return {
        agents,
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

export const getAgentByIdService = async (id: string) => {
    const agent = await prisma.referralAgent.findUnique({
        where: { id },
        select: agentSelect,
    });

    if (!agent) throw new Error("AGENT_NOT_FOUND");
    return agent;
};

export const createAgentService = async (data: CreateAgentInput) => {
    // Check phone uniqueness
    if (data.phone) {
        const phoneConflict = await prisma.referralAgent.findUnique({
            where: { phone: data.phone },
            select: { id: true },
        });
        if (phoneConflict) throw new Error("PHONE_TAKEN");
    }

    // Check email uniqueness
    if (data.email) {
        const emailConflict = await prisma.referralAgent.findUnique({
            where: { email: data.email },
            select: { id: true },
        });
        if (emailConflict) throw new Error("EMAIL_TAKEN");
    }

    return prisma.referralAgent.create({
        data: {
            name: data.name,
            phone: data.phone ?? null,
            email: data.email ?? null,
            organization: data.organization ?? null,
            agentType: data.agentType,
            commissionType: data.commissionType,
            commissionValue: data.commissionValue ?? null,
            notes: data.notes ?? null,
            isActive: data.isActive,
        },
        select: agentSelect,
    });
};

export const updateAgentService = async (
    id: string,
    data: UpdateAgentInput,
) => {
    const agent = await prisma.referralAgent.findUnique({
        where: { id },
        select: { id: true },
    });

    if (!agent) throw new Error("AGENT_NOT_FOUND");

    // Check phone uniqueness against other agents
    if (data.phone) {
        const conflict = await prisma.referralAgent.findFirst({
            where: { phone: data.phone, NOT: { id } },
            select: { id: true },
        });
        if (conflict) throw new Error("PHONE_TAKEN");
    }

    // Check email uniqueness against other agents
    if (data.email) {
        const conflict = await prisma.referralAgent.findFirst({
            where: { email: data.email, NOT: { id } },
            select: { id: true },
        });
        if (conflict) throw new Error("EMAIL_TAKEN");
    }

    return prisma.referralAgent.update({
        where: { id },
        data,
        select: agentSelect,
    });
};

export const deactivateAgentService = async (id: string) => {
    const agent = await prisma.referralAgent.findUnique({
        where: { id },
        select: { id: true, isActive: true },
    });

    if (!agent) throw new Error("AGENT_NOT_FOUND");
    if (!agent.isActive) throw new Error("AGENT_ALREADY_INACTIVE");

    await prisma.referralAgent.update({
        where: { id },
        data: { isActive: false },
    });

    return { message: "Referral agent deactivated successfully." };
};

// ══════════════════════════════════════════════════════════════════════════════
// REFERRALS
// ══════════════════════════════════════════════════════════════════════════════

export const listReferralsService = async (filters: ListReferralsInput) => {
    const { page, limit, agentId, isPaid } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ReferralWhereInput = {
        ...(agentId !== undefined && { agentId }),
        ...(isPaid !== undefined && { isPaid }),
    };

    const [referrals, total] = await Promise.all([
        prisma.referral.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            select: referralSelect,
        }),
        prisma.referral.count({ where }),
    ]);

    // Commission summary for admin
    const unpaidTotal = await prisma.referral.aggregate({
        where: { ...where, isPaid: false },
        _sum: { commissionEarned: true },
    });

    return {
        referrals,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1,
            unpaidCommission: Number(unpaidTotal._sum.commissionEarned ?? 0),
        },
    };
};

export const createReferralService = async (data: CreateReferralInput) => {
    const { agentId, appointmentId, notes } = data;

    // Validate agent exists and is active
    const agent = await prisma.referralAgent.findUnique({
        where: { id: agentId },
        select: {
            id: true,
            isActive: true,
            commissionType: true,
            commissionValue: true,
        },
    });

    if (!agent) throw new Error("AGENT_NOT_FOUND");
    if (!agent.isActive) throw new Error("AGENT_INACTIVE");

    // Validate appointment exists
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { id: true, fee: true },
    });

    if (!appointment) throw new Error("APPOINTMENT_NOT_FOUND");

    // Check no referral already exists for this appointment
    const existingReferral = await prisma.referral.findUnique({
        where: { appointmentId },
        select: { id: true },
    });

    if (existingReferral) throw new Error("REFERRAL_ALREADY_EXISTS");

    // Snapshot commission from agent at time of referral
    const commissionEarned = calcCommission(
        appointment.fee,
        agent.commissionType,
        agent.commissionValue ? Number(agent.commissionValue) : null,
    );

    return prisma.referral.create({
        data: {
            agentId,
            appointmentId,
            commissionType: agent.commissionType,
            commissionValue: agent.commissionValue,
            commissionEarned,
            notes: notes ?? null,
        },
        select: referralSelect,
    });
};

export const markReferralPaidService = async (
    id: string,
    data: MarkPaidInput,
) => {
    const referral = await prisma.referral.findUnique({
        where: { id },
        select: { id: true, isPaid: true },
    });

    if (!referral) throw new Error("REFERRAL_NOT_FOUND");
    if (referral.isPaid) throw new Error("REFERRAL_ALREADY_PAID");

    return prisma.referral.update({
        where: { id },
        data: {
            isPaid: true,
            paidAt: data.paidAt ?? new Date(),
        },
        select: referralSelect,
    });
};
