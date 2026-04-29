/** @format */

import { Request, Response } from "express";
import {
    agentIdSchema,
    referralIdSchema,
    listAgentsSchema,
    createAgentSchema,
    updateAgentSchema,
    listReferralsSchema,
    createReferralSchema,
    markPaidSchema,
} from "./schema";
import {
    listAgentsService,
    getAgentByIdService,
    createAgentService,
    updateAgentService,
    deactivateAgentService,
    listReferralsService,
    createReferralService,
    markReferralPaidService,
} from "./services";

// ─── Shared Error Handler ─────────────────────────────────────────────────────

const handleError = (error: unknown, res: Response, context: string): void => {
    if (error instanceof Error) {
        const map: Record<string, [number, string]> = {
            AGENT_NOT_FOUND: [404, "Referral agent not found."],
            AGENT_INACTIVE: [400, "This referral agent is inactive."],
            AGENT_ALREADY_INACTIVE: [
                400,
                "This referral agent is already inactive.",
            ],
            PHONE_TAKEN: [
                409,
                "An agent with this phone number already exists.",
            ],
            EMAIL_TAKEN: [409, "An agent with this email already exists."],
            REFERRAL_NOT_FOUND: [404, "Referral not found."],
            REFERRAL_ALREADY_EXISTS: [
                409,
                "A referral already exists for this appointment.",
            ],
            REFERRAL_ALREADY_PAID: [
                400,
                "This referral commission has already been marked as paid.",
            ],
            APPOINTMENT_NOT_FOUND: [404, "Appointment not found."],
        };

        const match = map[error.message];
        if (match) {
            res.status(match[0]).json({
                success: false,
                message: match[1],
                code: match[0],
            });
            return;
        }
    }

    console.error(`[${context}]`, error);
    res.status(500).json({
        success: false,
        message: "Internal server error.",
        code: 500,
    });
};

// ══════════════════════════════════════════════════════════════════════════════
// REFERRAL AGENT CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════════

export const listAgentsController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsed = listAgentsSchema.safeParse(req.query);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Invalid query parameters.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const result = await listAgentsService(parsed.data);

        res.status(200).json({
            success: true,
            message: "Referral agents retrieved successfully.",
            data: result.agents,
            meta: result.meta,
        });
    } catch (error) {
        handleError(error, res, "listAgentsController");
    }
};

export const getAgentByIdController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedId = agentIdSchema.safeParse(req.params.id);

        if (!parsedId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid agent ID.",
                errors: parsedId.error.flatten(),
            });
            return;
        }

        const agent = await getAgentByIdService(parsedId.data);

        res.status(200).json({
            success: true,
            message: "Referral agent retrieved successfully.",
            data: agent,
        });
    } catch (error) {
        handleError(error, res, "getAgentByIdController");
    }
};

export const createAgentController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsed = createAgentSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const agent = await createAgentService(parsed.data);

        res.status(201).json({
            success: true,
            message: "Referral agent created successfully.",
            data: agent,
        });
    } catch (error) {
        handleError(error, res, "createAgentController");
    }
};

export const updateAgentController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedId = agentIdSchema.safeParse(req.params.id);

        if (!parsedId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid agent ID.",
                errors: parsedId.error.flatten(),
            });
            return;
        }

        const parsed = updateAgentSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const agent = await updateAgentService(parsedId.data, parsed.data);

        res.status(200).json({
            success: true,
            message: "Referral agent updated successfully.",
            data: agent,
        });
    } catch (error) {
        handleError(error, res, "updateAgentController");
    }
};

export const deactivateAgentController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedId = agentIdSchema.safeParse(req.params.id);

        if (!parsedId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid agent ID.",
                errors: parsedId.error.flatten(),
            });
            return;
        }

        const result = await deactivateAgentService(parsedId.data);

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        handleError(error, res, "deactivateAgentController");
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// REFERRAL CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════════

export const listReferralsController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsed = listReferralsSchema.safeParse(req.query);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Invalid query parameters.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const result = await listReferralsService(parsed.data);

        res.status(200).json({
            success: true,
            message: "Referrals retrieved successfully.",
            data: result.referrals,
            meta: result.meta,
        });
    } catch (error) {
        handleError(error, res, "listReferralsController");
    }
};

export const createReferralController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsed = createReferralSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const referral = await createReferralService(parsed.data);

        res.status(201).json({
            success: true,
            message: "Referral created successfully.",
            data: referral,
        });
    } catch (error) {
        handleError(error, res, "createReferralController");
    }
};

export const markReferralPaidController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedId = referralIdSchema.safeParse(req.params.id);

        if (!parsedId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid referral ID.",
                errors: parsedId.error.flatten(),
            });
            return;
        }

        const parsed = markPaidSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const referral = await markReferralPaidService(
            parsedId.data,
            parsed.data,
        );

        res.status(200).json({
            success: true,
            message: "Referral commission marked as paid.",
            data: referral,
        });
    } catch (error) {
        handleError(error, res, "markReferralPaidController");
    }
};
