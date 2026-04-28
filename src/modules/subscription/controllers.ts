/** @format */

import { Request, Response } from "express";
import {
    CreateSubscriptionSchema,
    UpdateSubscriptionSchema,
    CancelSubscriptionSchema,
    IdParamSchema,
} from "./schema";
import { SubscriptionService } from "./services";
import { formatZodError, notFound, conflict } from "../../utils/response";

export const SubscriptionController = {
    // GET /subscriptions/me
    async getMySubscription(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const subscription =
                await SubscriptionService.getMySubscription(userId);
            if (!subscription) {
                return res
                    .status(404)
                    .json({ message: "No active subscription found" });
            }
            return res.status(200).json(subscription);
        } catch (err) {
            console.error("[Subscription] getMySubscription:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    // GET /subscriptions/:id  [SUPER_ADMIN]
    async getSubscriptionById(req: Request, res: Response) {
        try {
            const params = IdParamSchema.safeParse(req.params);
            if (!params.success) {
                return res.status(400).json(formatZodError(params.error));
            }

            const subscription = await SubscriptionService.getSubscriptionById(
                params.data.id,
            );
            if (!subscription) return notFound(res, "Subscription not found");

            return res.status(200).json(subscription);
        } catch (err) {
            console.error("[Subscription] getSubscriptionById:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    // POST /subscriptions
    async createSubscription(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;

            const body = CreateSubscriptionSchema.safeParse(req.body);
            if (!body.success) {
                return res.status(400).json(formatZodError(body.error));
            }

            const subscription = await SubscriptionService.createSubscription(
                userId,
                body.data,
            );
            return res.status(201).json(subscription);
        } catch (err: any) {
            if (err?.code === "CONFLICT") {
                return conflict(res, err.message);
            }
            if (err?.code === "NOT_FOUND") {
                return notFound(res, err.message);
            }
            console.error("[Subscription] createSubscription:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    // PATCH /subscriptions/:id
    async updateSubscription(req: Request, res: Response) {
        try {
            const params = IdParamSchema.safeParse(req.params);
            if (!params.success) {
                return res.status(400).json(formatZodError(params.error));
            }

            const body = UpdateSubscriptionSchema.safeParse(req.body);
            if (!body.success) {
                return res.status(400).json(formatZodError(body.error));
            }

            const subscription = await SubscriptionService.updateSubscription(
                params.data.id,
                body.data,
            );
            return res.status(200).json(subscription);
        } catch (err: any) {
            if (err?.code === "NOT_FOUND") {
                return notFound(res, err.message);
            }
            console.error("[Subscription] updateSubscription:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    // POST /subscriptions/:id/cancel
    async cancelSubscription(req: Request, res: Response) {
        try {
            const params = IdParamSchema.safeParse(req.params);
            if (!params.success) {
                return res.status(400).json(formatZodError(params.error));
            }

            const body = CancelSubscriptionSchema.safeParse(req.body ?? {});
            if (!body.success) {
                return res.status(400).json(formatZodError(body.error));
            }

            const subscription = await SubscriptionService.cancelSubscription(
                params.data.id,
                body.data,
            );
            return res.status(200).json(subscription);
        } catch (err: any) {
            if (err?.code === "NOT_FOUND") {
                return notFound(res, err.message);
            }
            if (err?.code === "CONFLICT") {
                return conflict(res, err.message);
            }
            console.error("[Subscription] cancelSubscription:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    },
};
