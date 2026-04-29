/** @format */

import { Router } from "express";
import {
    listAgentsController,
    getAgentByIdController,
    createAgentController,
    updateAgentController,
    deactivateAgentController,
    listReferralsController,
    createReferralController,
    markReferralPaidController,
} from "./controllers";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

// ─── Referral Agent Router ────────────────────────────────────────────────────

export const agentRouter = Router();

agentRouter.use(authenticate);

/**
 * GET /referral-agents
 * List all agents with optional agentType + isActive filters.
 * Admin / Super Admin only.
 */
agentRouter.get("/", authorize("ADMIN", "SUPER_ADMIN"), listAgentsController);

/**
 * POST /referral-agents
 * Create a new referral agent.
 * Admin / Super Admin only.
 */
agentRouter.post("/", authorize("ADMIN", "SUPER_ADMIN"), createAgentController);

/**
 * GET /referral-agents/:id
 * Get a single agent by ID.
 */
agentRouter.get(
    "/:id",
    authorize("ADMIN", "SUPER_ADMIN"),
    getAgentByIdController,
);

/**
 * PATCH /referral-agents/:id
 * Update agent details.
 */
agentRouter.patch(
    "/:id",
    authorize("ADMIN", "SUPER_ADMIN"),
    updateAgentController,
);

/**
 * DELETE /referral-agents/:id
 * Soft deactivate — sets isActive: false.
 * Agent stays in DB so existing referral records keep their FK.
 */
agentRouter.delete(
    "/:id",
    authorize("ADMIN", "SUPER_ADMIN"),
    deactivateAgentController,
);

// ─── Referral Router ──────────────────────────────────────────────────────────

export const referralRouter = Router();

referralRouter.use(authenticate);

/**
 * GET /referrals
 * List all referrals — filter by agentId and/or isPaid.
 * Meta includes total unpaid commission amount.
 */
referralRouter.get(
    "/",
    authorize("ADMIN", "SUPER_ADMIN"),
    listReferralsController,
);

/**
 * POST /referrals
 * Manually create a referral.
 * Commission is auto-snapshotted from the agent's current rates.
 * Note: referrals are also auto-created inside createAppointment
 * when referralAgentId is passed — this endpoint is for manual creation only.
 */
referralRouter.post(
    "/",
    authorize("ADMIN", "SUPER_ADMIN"),
    createReferralController,
);

/**
 * PATCH /referrals/:id/pay
 * Mark a referral's commission as paid.
 * paidAt defaults to current timestamp if not provided.
 */
referralRouter.patch(
    "/:id/pay",
    authorize("ADMIN", "SUPER_ADMIN"),
    markReferralPaidController,
);
