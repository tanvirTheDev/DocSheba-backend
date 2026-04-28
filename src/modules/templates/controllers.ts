/** @format */

import { Request, Response } from "express";
import * as TemplateService from "./services";
import {
    CreateAdviceTemplateInput,
    UpdateAdviceTemplateInput,
    CreateDrugTemplateInput,
    UpdateDrugTemplateInput,
    CreateTreatmentTemplateInput,
    UpdateTreatmentTemplateInput,
    CreatePrescriptionTemplateInput,
    UpdatePrescriptionTemplateInput,
} from "./schema";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const getDoctorId = (req: Request): string => req.user!.userId;

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
        const doctorId = getDoctorId(req);
        const { id } = req.params as { id: string };
        // service signature: getAdviceTemplateById(id, doctorId)
        const template = await TemplateService.getAdviceTemplateById(
            id,
            doctorId,
        );
        if (!template) return void notFound(res);
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
        const body = req.body as CreateAdviceTemplateInput;
        const template = await TemplateService.createAdviceTemplate(
            doctorId,
            body,
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
        const doctorId = getDoctorId(req);
        const { id } = req.params as { id: string };
        const body = req.body as UpdateAdviceTemplateInput;
        // service signature: updateAdviceTemplate(id, doctorId, data)
        const template = await TemplateService.updateAdviceTemplate(
            id,
            doctorId,
            body,
        );
        if (!template) return void notFound(res);
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
        const { id } = req.params as { id: string };

        const result = await TemplateService.deleteAdviceTemplate(id, doctorId);
        if (!result) return void notFound(res);
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
        const { id } = req.params as { id: string };
        const template = await TemplateService.getDrugTemplateById(
            id,
            doctorId,
        );
        if (!template) return void notFound(res);
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
        const body = req.body as CreateDrugTemplateInput;
        const template = await TemplateService.createDrugTemplate(
            doctorId,
            body,
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
        const { id } = req.params as { id: string };
        const body = req.body as UpdateDrugTemplateInput;
        const template = await TemplateService.updateDrugTemplate(
            id,
            doctorId,
            body,
        );
        if (!template) return void notFound(res);
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
        const { id } = req.params as { id: string };
        const result = await TemplateService.deleteDrugTemplate(id, doctorId);
        if (!result) return void notFound(res);
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
        const { id } = req.params as { id: string };
        const template = await TemplateService.getTreatmentTemplateById(
            id,
            doctorId,
        );
        if (!template) return void notFound(res);
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
        const body = req.body as CreateTreatmentTemplateInput;
        const template = await TemplateService.createTreatmentTemplate(
            doctorId,
            body,
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
        const { id } = req.params as { id: string };
        const body = req.body as UpdateTreatmentTemplateInput;
        const template = await TemplateService.updateTreatmentTemplate(
            id,
            doctorId,
            body,
        );
        if (!template) return void notFound(res);
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
        const { id } = req.params as { id: string };
        const result = await TemplateService.deleteTreatmentTemplate(
            id,
            doctorId,
        );
        if (!result) return void notFound(res);
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
        const { id } = req.params as { id: string };
        const template = await TemplateService.getPrescriptionTemplateById(
            id,
            doctorId,
        );
        if (!template) return void notFound(res);
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
        const body = req.body as CreatePrescriptionTemplateInput;
        const template = await TemplateService.createPrescriptionTemplate(
            doctorId,
            body,
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
        const { id } = req.params as { id: string };
        const body = req.body as UpdatePrescriptionTemplateInput;
        const template = await TemplateService.updatePrescriptionTemplate(
            id,
            doctorId,
            body,
        );
        if (!template) return void notFound(res);
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
        const { id } = req.params as { id: string };
        const result = await TemplateService.deletePrescriptionTemplate(
            id,
            doctorId,
        );
        if (!result) return void notFound(res);
        ok(res, { message: "Prescription template deleted successfully" });
    } catch (error) {
        serverError(res, error);
    }
};
