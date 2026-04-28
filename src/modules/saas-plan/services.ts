/** @format */

import { prisma } from "../../lib/prisma";
import type { CreateSaasPlanInput, UpdateSaasPlanInput } from "./schema";

export const SaasPlanService = {
    async listPlans() {
        return prisma.saasPlan.findMany({
            orderBy: { createdAt: "asc" },
        });
    },

    async getPlanById(id: string) {
        return prisma.saasPlan.findUnique({
            where: { id },
        });
    },

    async createPlan(data: CreateSaasPlanInput) {
        return prisma.saasPlan.create({
            data: {
                ...data,
                monthlyPrice: data.monthlyPrice,
                yearlyPrice: data.yearlyPrice,
            },
        });
    },

    async updatePlan(id: string, data: UpdateSaasPlanInput) {
        return prisma.saasPlan.update({
            where: { id },
            data,
        });
    },
};
