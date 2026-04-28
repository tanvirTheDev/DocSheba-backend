/** @format */

import { prisma } from "../../lib/prisma";
import type {
    CreateSubscriptionInput,
    UpdateSubscriptionInput,
    CancelSubscriptionInput,
} from "./schema";

// ─── Helpers ──────────────────────────────────────────────────

function calcEndDate(start: Date, cycle: "MONTHLY" | "YEARLY"): Date {
    const end = new Date(start);
    if (cycle === "YEARLY") {
        end.setFullYear(end.getFullYear() + 1);
    } else {
        end.setMonth(end.getMonth() + 1);
    }
    return end;
}

// ─── Service ─────────────────────────────────────────────────

export const SubscriptionService = {
    async getMySubscription(userId: string) {
        return prisma.subscription.findFirst({
            where: {
                userId,
                status: { notIn: ["CANCELLED", "EXPIRED"] },
            },
            include: { plan: true },
        });
    },

    async getSubscriptionById(id: string) {
        return prisma.subscription.findUnique({
            where: { id },
            include: { plan: true, user: true },
        });
    },

    async createSubscription(userId: string, data: CreateSubscriptionInput) {
        // Check for existing active subscription
        const existing = await prisma.subscription.findFirst({
            where: {
                userId,
                status: { notIn: ["CANCELLED", "EXPIRED"] },
            },
        });

        if (existing) {
            const err = new Error("User already has an active subscription");
            (err as any).code = "CONFLICT";
            throw err;
        }

        const plan = await prisma.saasPlan.findUnique({
            where: { id: data.planId },
        });

        if (!plan) {
            const err = new Error("Plan not found");
            (err as any).code = "NOT_FOUND";
            throw err;
        }

        const now = new Date();
        const startDate = now;
        const endDate = calcEndDate(now, data.billingCycle ?? "MONTHLY");
        const amount =
            data.billingCycle === "YEARLY"
                ? plan.yearlyPrice
                : plan.monthlyPrice;

        return prisma.$transaction(async (tx) => {
            const subscription = await tx.subscription.create({
                data: {
                    userId,
                    planId: data.planId,
                    billingCycle: data.billingCycle ?? "MONTHLY",
                    autoRenew: data.autoRenew ?? true,
                    status: data.trialEndsAt ? "TRIAL" : "ACTIVE",
                    trialEndsAt: data.trialEndsAt,
                    startDate,
                    endDate,
                    nextBillingAt: endDate,
                },
                include: { plan: true },
            });

            // Create first invoice
            await tx.invoice.create({
                data: {
                    subscriptionId: subscription.id,
                    amount,
                    billingCycle: data.billingCycle ?? "MONTHLY",
                    periodStart: startDate,
                    periodEnd: endDate,
                    dueDate: endDate,
                    status: "PENDING",
                },
            });

            return subscription;
        });
    },

    async updateSubscription(id: string, data: UpdateSubscriptionInput) {
        const subscription = await prisma.subscription.findUnique({
            where: { id },
        });

        if (!subscription) {
            const err = new Error("Subscription not found");
            (err as any).code = "NOT_FOUND";
            throw err;
        }

        // Recalculate endDate if billing cycle changes
        let endDate = subscription.endDate;
        if (
            data.billingCycle &&
            data.billingCycle !== subscription.billingCycle
        ) {
            endDate = calcEndDate(new Date(), data.billingCycle);
        }

        return prisma.subscription.update({
            where: { id },
            data: {
                ...data,
                endDate,
                nextBillingAt: endDate,
            },
            include: { plan: true },
        });
    },

    async cancelSubscription(id: string, data: CancelSubscriptionInput) {
        const subscription = await prisma.subscription.findUnique({
            where: { id },
        });

        if (!subscription) {
            const err = new Error("Subscription not found");
            (err as any).code = "NOT_FOUND";
            throw err;
        }

        if (subscription.status === "CANCELLED") {
            const err = new Error("Subscription is already cancelled");
            (err as any).code = "CONFLICT";
            throw err;
        }

        return prisma.subscription.update({
            where: { id },
            data: {
                status: "CANCELLED",
                autoRenew: false,
                cancelledAt: new Date(),
                cancellationNote: data.cancellationNote,
            },
            include: { plan: true },
        });
    },
};
