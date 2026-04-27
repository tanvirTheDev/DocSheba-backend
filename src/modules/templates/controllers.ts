/** @format */

import { Request, Response } from "express";
import * as TemplateService from "./services";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const getDoctorId = (req: Request): string => (req as any).user.userId;

const notFound = (res: Response, message = "Template not found") =>
    res.status(404).json({ success: false, message });

const ok = <T>(res: Response, data: T, status = 200) =>
    res.status(status).json({ success: true, data });

const serverError = (res: Response, error: unknown) => {
    console.error("[TemplateController]", error);
    return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
};

// ─────────────────────────────────────────────────────────────
// ADVICE TEMPLATE CONTROLLERS
// ─────────────────────────────────────────────────────────────

export const listAdviceTemplates = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const doctorId = getDoctorId(req);
        const templates = await TemplateService.listAdviceTemplates(doctorId);
        ok(res, templates);
    } catch (error) {
        serverError(res, error);
    }
};

export const getAdviceTemplate = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { userId } = req.user!;
        const { id } = req.params; // ✅ always string from req.params
        const template = await TemplateService.getAdviceTemplateById(
            userId,
            id,
        );
        if (!template) {
            notFound(res);
            return;
        }
        ok(res, template);
    } catch (error) {
        serverError(res, error);
    }
};

export const createAdviceTemplate = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const doctorId = getDoctorId(req);
        const template = await TemplateService.createAdviceTemplate(
            doctorId,
            req.body,
        );
        ok(res, template, 201);
    } catch (error) {
        serverError(res, error);
    }
};

export const updateAdviceTemplate = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { userId } = req.user!;
        const template = await TemplateService.updateAdviceTemplate(
            userId,
            doctorId,
            req.body,
        );
        if (!template) {
            notFound(res);
            return;
        }
        ok(res, template);
    } catch (error) {
        serverError(res, error);
    }
};

export const deleteAdviceTemplate = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const doctorId = getDoctorId(req);
        const { userId } = req.user!;
        const result = await TemplateService.deleteAdviceTemplate(
            userId,
            doctorId,
        );
        if (!result) {
            notFound(res);
            return;
        }
        ok(res, { message: "Advice template deleted successfully" });
    } catch (error) {
        serverError(res, error);
    }
};

// ─────────────────────────────────────────────────────────────
// DRUG TEMPLATE CONTROLLERS
// ─────────────────────────────────────────────────────────────

export const listDrugTemplates = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const doctorId = getDoctorId(req);
        const templates = await TemplateService.listDrugTemplates(doctorId);
        ok(res, templates);
    } catch (error) {
        serverError(res, error);
    }
};

export const getDrugTemplate = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const doctorId = getDoctorId(req);
        const template = await TemplateService.getDrugTemplateById(
            req.params.id,
            doctorId,
        );
        if (!template) {
            notFound(res);
            return;
        }
        ok(res, template);
    } catch (error) {
        serverError(res, error);
    }
};

export const createDrugTemplate = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const doctorId = getDoctorId(req);
        const template = await TemplateService.createDrugTemplate(
            doctorId,
            req.body,
        );
        ok(res, template, 201);
    } catch (error) {
        serverError(res, error);
    }
};

export const updateDrugTemplate = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const doctorId = getDoctorId(req);
        const template = await TemplateService.updateDrugTemplate(
            req.params.id,
            doctorId,
            req.body,
        );
        if (!template) {
            notFound(res);
            return;
        }
        ok(res, template);
    } catch (error) {
        serverError(res, error);
    }
};

export const deleteDrugTemplate = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const doctorId = getDoctorId(req);
        const result = await TemplateService.deleteDrugTemplate(
            req.params.id,
            doctorId,
        );
        if (!result) {
            notFound(res);
            return;
        }
        ok(res, { message: "Drug template deleted successfully" });
    } catch (error) {
        serverError(res, error);
    }
};

// ─────────────────────────────────────────────────────────────
// TREATMENT TEMPLATE CONTROLLERS
// ─────────────────────────────────────────────────────────────

export const listTreatmentTemplates = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const doctorId = getDoctorId(req);
        const templates =
            await TemplateService.listTreatmentTemplates(doctorId);
        ok(res, templates);
    } catch (error) {
        serverError(res, error);
    }
};

export const getTreatmentTemplate = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const doctorId = getDoctorId(req);
        const template = await TemplateService.getTreatmentTemplateById(
            req.params.id,
            doctorId,
        );
        if (!template) {
            notFound(res);
            return;
        }
        ok(res, template);
    } catch (error) {
        serverError(res, error);
    }
};

export const createTreatmentTemplate = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const doctorId = getDoctorId(req);
        const template = await TemplateService.createTreatmentTemplate(
            doctorId,
            req.body,
        );
        ok(res, template, 201);
    } catch (error) {
        serverError(res, error);
    }
};

export const updateTreatmentTemplate = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const doctorId = getDoctorId(req);
        const template = await TemplateService.updateTreatmentTemplate(
            req.params.id,
            doctorId,
            req.body,
        );
        if (!template) {
            notFound(res);
            return;
        }
        ok(res, template);
    } catch (error) {
        serverError(res, error);
    }
};

export const deleteTreatmentTemplate = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const doctorId = getDoctorId(req);
        const result = await TemplateService.deleteTreatmentTemplate(
            req.params.id,
            doctorId,
        );
        if (!result) {
            notFound(res);
            return;
        }
        ok(res, { message: "Treatment template deleted successfully" });
    } catch (error) {
        serverError(res, error);
    }
};

// ─────────────────────────────────────────────────────────────
// PRESCRIPTION TEMPLATE CONTROLLERS
// ─────────────────────────────────────────────────────────────

export const listPrescriptionTemplates = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const doctorId = getDoctorId(req);
        const templates =
            await TemplateService.listPrescriptionTemplates(doctorId);
        ok(res, templates);
    } catch (error) {
        serverError(res, error);
    }
};

export const getPrescriptionTemplate = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const doctorId = getDoctorId(req);
        const template = await TemplateService.getPrescriptionTemplateById(
            req.params.id,
            doctorId,
        );
        if (!template) {
            notFound(res);
            return;
        }
        ok(res, template);
    } catch (error) {
        serverError(res, error);
    }
};

export const createPrescriptionTemplate = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const doctorId = getDoctorId(req);
        const template = await TemplateService.createPrescriptionTemplate(
            doctorId,
            req.body,
        );
        ok(res, template, 201);
    } catch (error) {
        serverError(res, error);
    }
};

export const updatePrescriptionTemplate = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const doctorId = getDoctorId(req);
        const template = await TemplateService.updatePrescriptionTemplate(
            req.params.id,
            doctorId,
            req.body,
        );
        if (!template) {
            notFound(res);
            return;
        }
        ok(res, template);
    } catch (error) {
        serverError(res, error);
    }
};

export const deletePrescriptionTemplate = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const doctorId = getDoctorId(req);
        const result = await TemplateService.deletePrescriptionTemplate(
            req.params.id,
            doctorId,
        );
        if (!result) {
            notFound(res);
            return;
        }
        ok(res, { message: "Prescription template deleted successfully" });
    } catch (error) {
        serverError(res, error);
    }
};
