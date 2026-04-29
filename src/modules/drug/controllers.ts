/** @format */

import { Request, Response } from "express";
import { Role } from "../../generated/prisma/enums";
import {
    drugIdSchema,
    templateIdSchema,
    searchDrugsSchema,
    createDrugSchema,
    updateDrugSchema,
    createDrugTemplateSchema,
    updateDrugTemplateSchema,
} from "./schema";
import {
    searchDrugsService,
    getDrugByIdService,
    createDrugService,
    updateDrugService,
    deactivateDrugService,
    listDrugTemplatesService,
    createDrugTemplateService,
    updateDrugTemplateService,
    deleteDrugTemplateService,
} from "./services";

// ─── Shared Error Handler ─────────────────────────────────────────────────────

const handleError = (error: unknown, res: Response, context: string): void => {
    if (error instanceof Error) {
        const map: Record<string, [number, string]> = {
            DRUG_NOT_FOUND: [404, "Drug not found."],
            DRUG_ALREADY_EXISTS: [
                409,
                "A drug with the same brand name, strength, and form already exists.",
            ],
            DRUG_ALREADY_INACTIVE: [400, "This drug is already deactivated."],
            TEMPLATE_NOT_FOUND: [404, "Drug template not found."],
            FORBIDDEN: [403, "You are not allowed to perform this action."],
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
// DRUG CATALOGUE
// ══════════════════════════════════════════════════════════════════════════════

export const searchDrugsController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsed = searchDrugsSchema.safeParse(req.query);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Invalid query parameters.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const result = await searchDrugsService(parsed.data);

        res.status(200).json({
            success: true,
            message: "Drugs retrieved successfully.",
            data: result.drugs,
            meta: result.meta,
        });
    } catch (error) {
        handleError(error, res, "searchDrugsController");
    }
};

export const getDrugByIdController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedId = drugIdSchema.safeParse(req.params.id);

        if (!parsedId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid drug ID.",
                errors: parsedId.error.flatten(),
            });
            return;
        }

        const drug = await getDrugByIdService(parsedId.data);

        res.status(200).json({
            success: true,
            message: "Drug retrieved successfully.",
            data: drug,
        });
    } catch (error) {
        handleError(error, res, "getDrugByIdController");
    }
};

export const createDrugController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsed = createDrugSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const drug = await createDrugService(parsed.data);

        res.status(201).json({
            success: true,
            message: "Drug added to catalogue successfully.",
            data: drug,
        });
    } catch (error) {
        handleError(error, res, "createDrugController");
    }
};

export const updateDrugController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedId = drugIdSchema.safeParse(req.params.id);

        if (!parsedId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid drug ID.",
                errors: parsedId.error.flatten(),
            });
            return;
        }

        const parsed = updateDrugSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const drug = await updateDrugService(parsedId.data, parsed.data);

        res.status(200).json({
            success: true,
            message: "Drug updated successfully.",
            data: drug,
        });
    } catch (error) {
        handleError(error, res, "updateDrugController");
    }
};

export const deactivateDrugController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedId = drugIdSchema.safeParse(req.params.id);

        if (!parsedId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid drug ID.",
                errors: parsedId.error.flatten(),
            });
            return;
        }

        const result = await deactivateDrugService(parsedId.data);

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        handleError(error, res, "deactivateDrugController");
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// DRUG TEMPLATES
// ══════════════════════════════════════════════════════════════════════════════

export const listDrugTemplatesController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { userId: requesterId, role: requesterRole } = req.user!;

        const templates = await listDrugTemplatesService(
            requesterId,
            requesterRole as Role,
        );

        res.status(200).json({
            success: true,
            message: "Drug templates retrieved successfully.",
            data: templates,
        });
    } catch (error) {
        handleError(error, res, "listDrugTemplatesController");
    }
};

export const createDrugTemplateController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsed = createDrugTemplateSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const { userId: requesterId, role: requesterRole } = req.user!;

        const template = await createDrugTemplateService(
            parsed.data,
            requesterId,
            requesterRole as Role,
        );

        res.status(201).json({
            success: true,
            message: "Drug template created successfully.",
            data: template,
        });
    } catch (error) {
        handleError(error, res, "createDrugTemplateController");
    }
};

export const updateDrugTemplateController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedId = templateIdSchema.safeParse(req.params.id);

        if (!parsedId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid template ID.",
                errors: parsedId.error.flatten(),
            });
            return;
        }

        const parsed = updateDrugTemplateSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const { userId: requesterId, role: requesterRole } = req.user!;

        const template = await updateDrugTemplateService(
            parsedId.data,
            parsed.data,
            requesterId,
            requesterRole as Role,
        );

        res.status(200).json({
            success: true,
            message: "Drug template updated successfully.",
            data: template,
        });
    } catch (error) {
        handleError(error, res, "updateDrugTemplateController");
    }
};

export const deleteDrugTemplateController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsedId = templateIdSchema.safeParse(req.params.id);

        if (!parsedId.success) {
            res.status(400).json({
                success: false,
                message: "Invalid template ID.",
                errors: parsedId.error.flatten(),
            });
            return;
        }

        const { userId: requesterId, role: requesterRole } = req.user!;

        const result = await deleteDrugTemplateService(
            parsedId.data,
            requesterId,
            requesterRole as Role,
        );

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        handleError(error, res, "deleteDrugTemplateController");
    }
};
