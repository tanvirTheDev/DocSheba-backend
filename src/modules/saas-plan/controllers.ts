/** @format */

import { Request, Response } from "express";
import { ZodError } from "zod";
import {
    CreateSaasPlanSchema,
    UpdateSaasPlanSchema,
    IdParamSchema,
} from "./schema";
import { SaasPlanService } from "./services";
import { formatZodError, notFound, conflict } from "../../utils/response";

export const SaasPlanController = {
    // GET /saas/plans
    async listPlans(req: Request, res: Response) {
        try {
            const plans = await SaasPlanService.listPlans();
            return res.status(200).json(plans);
        } catch (err) {
            console.error("[SaasPlan] listPlans:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    // GET /saas/plans/:id
    async getPlanById(req: Request, res: Response) {
        try {
            const params = IdParamSchema.safeParse(req.params);
            if (!params.success) {
                return res.status(400).json(formatZodError(params.error));
            }

            const plan = await SaasPlanService.getPlanById(params.data.id);
            if (!plan) return notFound(res, "Plan not found");

            return res.status(200).json(plan);
        } catch (err) {
            console.error("[SaasPlan] getPlanById:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    // POST /saas/plans  [SUPER_ADMIN]
    async createPlan(req: Request, res: Response) {
        try {
            const body = CreateSaasPlanSchema.safeParse(req.body);
            if (!body.success) {
                return res.status(400).json(formatZodError(body.error));
            }

            const plan = await SaasPlanService.createPlan(body.data);
            return res.status(201).json(plan);
        } catch (err: any) {
            if (err?.code === "P2002") {
                return conflict(res, "A plan with this name already exists");
            }
            console.error("[SaasPlan] createPlan:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    // PATCH /saas/plans/:id  [SUPER_ADMIN]
    async updatePlan(req: Request, res: Response) {
        try {
            const params = IdParamSchema.safeParse(req.params);
            if (!params.success) {
                return res.status(400).json(formatZodError(params.error));
            }

            const body = UpdateSaasPlanSchema.safeParse(req.body);
            if (!body.success) {
                return res.status(400).json(formatZodError(body.error));
            }

            const existing = await SaasPlanService.getPlanById(params.data.id);
            if (!existing) return notFound(res, "Plan not found");

            const plan = await SaasPlanService.updatePlan(
                params.data.id,
                body.data,
            );
            return res.status(200).json(plan);
        } catch (err: any) {
            if (err?.code === "P2025") {
                return notFound(res, "Plan not found");
            }
            console.error("[SaasPlan] updatePlan:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    },
};
