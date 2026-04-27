/** @format */

import { Request, Response } from "express";
import { Role } from "../../generated/prisma/enums";
import {
    prescriptionIdSchema,
    itemIdSchema,
    createPrescriptionSchema,
    updatePrescriptionSchema,
    chiefComplaintSchema,
    updateChiefComplaintSchema,
    historySchema,
    examinationSchema,
    updateExaminationSchema,
    diagnosisSchema,
    updateDiagnosisSchema,
    investigationSchema,
    updateInvestigationSchema,
    rxItemSchema,
    updateRxItemSchema,
    adviceSchema,
    updateAdviceSchema,
    reportEntrySchema,
    updateReportEntrySchema,
    bmiRecordSchema,
    drugHistorySchema,
    updateDrugHistorySchema,
    planSchema,
    updatePlanSchema,
    noteSchema,
    updateNoteSchema,
} from "./schema";
import * as svc from "./services";

// ─── Shared Error Handler ─────────────────────────────────────────────────────

const handleError = (error: unknown, res: Response, context: string): void => {
    if (error instanceof Error) {
        const map: Record<string, [number, string]> = {
            PRESCRIPTION_NOT_FOUND: [404, "Prescription not found."],
            PRESCRIPTION_ALREADY_EXISTS: [
                409,
                "A prescription already exists for this appointment.",
            ],
            PRESCRIPTION_FINALIZED: [
                400,
                "Cannot edit a FINALIZED prescription.",
            ],
            PRESCRIPTION_PRINTED: [400, "Cannot edit a PRINTED prescription."],
            PRESCRIPTION_NOT_FINALIZED: [
                400,
                "Prescription must be FINALIZED before printing.",
            ],
            APPOINTMENT_NOT_FOUND: [404, "Appointment not found."],
            FORBIDDEN: [403, "You are not allowed to perform this action."],
            ITEM_NOT_FOUND: [404, "Item not found in this prescription."],
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

// ─── Param helper ─────────────────────────────────────────────────────────────

const parseParams = (res: Response, rawRxId: unknown, rawItemId?: unknown) => {
    const rxParsed = prescriptionIdSchema.safeParse(rawRxId);
    if (!rxParsed.success) {
        res.status(400).json({
            success: false,
            message: "Invalid prescription ID.",
        });
        return null;
    }
    if (rawItemId !== undefined) {
        const itemParsed = itemIdSchema.safeParse(rawItemId);
        if (!itemParsed.success) {
            res.status(400).json({
                success: false,
                message: "Invalid item ID.",
            });
            return null;
        }
        return { prescriptionId: rxParsed.data, itemId: itemParsed.data };
    }
    return { prescriptionId: rxParsed.data };
};

// ══════════════════════════════════════════════════════════════════════════════
// PRESCRIPTION ROOT
// ══════════════════════════════════════════════════════════════════════════════

export const createPrescriptionController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const parsed = createPrescriptionSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }
        const { id, role } = req.user!;
        const data = await svc.createPrescriptionService(
            parsed.data,
            id,
            role as Role,
        );
        res.status(201).json({
            success: true,
            message: "Prescription created.",
            data,
        });
    } catch (e) {
        handleError(e, res, "createPrescriptionController");
    }
};

export const getPrescriptionByIdController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const params = parseParams(res, req.params.id);
        if (!params) return;
        const { id, role } = req.user!;
        const data = await svc.getPrescriptionByIdService(
            params.prescriptionId,
            id,
            role as Role,
        );
        res.status(200).json({
            success: true,
            message: "Prescription retrieved.",
            data,
        });
    } catch (e) {
        handleError(e, res, "getPrescriptionByIdController");
    }
};

export const updatePrescriptionController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const params = parseParams(res, req.params.id);
        if (!params) return;
        const parsed = updatePrescriptionSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }
        const { id, role } = req.user!;
        const data = await svc.updatePrescriptionService(
            params.prescriptionId,
            parsed.data,
            id,
            role as Role,
        );
        res.status(200).json({
            success: true,
            message: "Prescription updated.",
            data,
        });
    } catch (e) {
        handleError(e, res, "updatePrescriptionController");
    }
};

export const printPrescriptionController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const params = parseParams(res, req.params.id);
        if (!params) return;
        const { id, role } = req.user!;
        const data = await svc.printPrescriptionService(
            params.prescriptionId,
            id,
            role as Role,
        );
        res.status(200).json({
            success: true,
            message: "Prescription marked as PRINTED.",
            data,
        });
    } catch (e) {
        handleError(e, res, "printPrescriptionController");
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// SECTION FACTORY
// Creates list / add / update / delete controllers for each sub-section
// ══════════════════════════════════════════════════════════════════════════════

const makeSectionControllers = (
    section: string,
    listFn: (rxId: string) => Promise<unknown>,
    addFn: (
        rxId: string,
        data: unknown,
        uid: string,
        role: Role,
    ) => Promise<unknown>,
    updateFn: (
        rxId: string,
        id: string,
        data: unknown,
        uid: string,
        role: Role,
    ) => Promise<unknown>,
    deleteFn: (
        rxId: string,
        id: string,
        uid: string,
        role: Role,
    ) => Promise<unknown>,
    addSchema: {
        safeParse: (d: unknown) => {
            success: boolean;
            data?: unknown;
            error?: { flatten: () => { fieldErrors: unknown } };
        };
    },
    updateSchema: {
        safeParse: (d: unknown) => {
            success: boolean;
            data?: unknown;
            error?: { flatten: () => { fieldErrors: unknown } };
        };
    },
) => ({
    list: async (req: Request, res: Response): Promise<void> => {
        try {
            const params = parseParams(res, req.params.prescriptionId);
            if (!params) return;
            const data = await listFn(params.prescriptionId);
            res.status(200).json({
                success: true,
                message: `${section} retrieved.`,
                data,
            });
        } catch (e) {
            handleError(e, res, `list${section}Controller`);
        }
    },
    add: async (req: Request, res: Response): Promise<void> => {
        try {
            const params = parseParams(res, req.params.prescriptionId);
            if (!params) return;
            const parsed = addSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(422).json({
                    success: false,
                    message: "Validation failed.",
                    errors: parsed.error!.flatten().fieldErrors,
                });
                return;
            }
            const { id, role } = req.user!;
            const data = await addFn(
                params.prescriptionId,
                parsed.data,
                id,
                role as Role,
            );
            res.status(201).json({
                success: true,
                message: `${section} added.`,
                data,
            });
        } catch (e) {
            handleError(e, res, `add${section}Controller`);
        }
    },
    update: async (req: Request, res: Response): Promise<void> => {
        try {
            const params = parseParams(
                res,
                req.params.prescriptionId,
                req.params.id,
            );
            if (!params) return;
            const parsed = updateSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(422).json({
                    success: false,
                    message: "Validation failed.",
                    errors: parsed.error!.flatten().fieldErrors,
                });
                return;
            }
            const { id, role } = req.user!;
            const data = await updateFn(
                params.prescriptionId,
                params.itemId!,
                parsed.data,
                id,
                role as Role,
            );
            res.status(200).json({
                success: true,
                message: `${section} updated.`,
                data,
            });
        } catch (e) {
            handleError(e, res, `update${section}Controller`);
        }
    },
    delete: async (req: Request, res: Response): Promise<void> => {
        try {
            const params = parseParams(
                res,
                req.params.prescriptionId,
                req.params.id,
            );
            if (!params) return;
            const { id, role } = req.user!;
            const result = await deleteFn(
                params.prescriptionId,
                params.itemId!,
                id,
                role as Role,
            );
            res.status(200).json({ success: true, ...(result as object) });
        } catch (e) {
            handleError(e, res, `delete${section}Controller`);
        }
    },
});

// ── Build all section controllers ─────────────────────────────────────────────

export const chiefComplaintControllers = makeSectionControllers(
    "ChiefComplaint",
    svc.listChiefComplaintsService,
    svc.addChiefComplaintService,
    svc.updateChiefComplaintService,
    svc.deleteChiefComplaintService,
    chiefComplaintSchema,
    updateChiefComplaintSchema,
);
export const examinationControllers = makeSectionControllers(
    "Examination",
    svc.listExaminationsService,
    svc.addExaminationService,
    svc.updateExaminationService,
    svc.deleteExaminationService,
    examinationSchema,
);
export const diagnosisControllers = makeSectionControllers(
    "Diagnosis",
    svc.listDiagnosesService,
    svc.addDiagnosisService,
    svc.updateDiagnosisService,
    svc.deleteDiagnosisService,
    diagnosisSchema,
    updateDiagnosisSchema,
);
export const investigationControllers = makeSectionControllers(
    "Investigation",
    svc.listInvestigationsService,
    svc.addInvestigationService,
    svc.updateInvestigationService,
    svc.deleteInvestigationService,
    investigationSchema,
    updateInvestigationSchema,
);
export const rxItemControllers = makeSectionControllers(
    "RxItem",
    svc.listRxItemsService,
    svc.addRxItemService,
    svc.updateRxItemService,
    svc.deleteRxItemService,
    rxItemSchema,
    updateRxItemSchema,
);
export const adviceControllers = makeSectionControllers(
    "Advice",
    svc.listAdviceService,
    svc.addAdviceService,
    svc.updateAdviceService,
    svc.deleteAdviceService,
    adviceSchema,
    updateAdviceSchema,
);
export const reportEntryControllers = makeSectionControllers(
    "ReportEntry",
    svc.listReportEntriesService,
    svc.addReportEntryService,
    svc.updateReportEntryService,
    svc.deleteReportEntryService,
    reportEntrySchema,
    updateReportEntrySchema,
);
export const drugHistoryControllers = makeSectionControllers(
    "DrugHistory",
    svc.listDrugHistoryService,
    svc.addDrugHistoryService,
    svc.updateDrugHistoryService,
    svc.deleteDrugHistoryService,
    drugHistorySchema,
    updateDrugHistorySchema,
);
export const planControllers = makeSectionControllers(
    "Plan",
    svc.listPlansService,
    svc.addPlanService,
    svc.updatePlanService,
    svc.deletePlanService,
    planSchema,
    updatePlanSchema,
);
export const noteControllers = makeSectionControllers(
    "Note",
    svc.listNotesService,
    svc.addNoteService,
    svc.updateNoteService,
    svc.deleteNoteService,
    noteSchema,
    updateNoteSchema,
);

// ── History (upsert — no list/delete) ────────────────────────────────────────

export const getHistoryController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const params = parseParams(res, req.params.prescriptionId);
        if (!params) return;
        const data = await svc.getHistoryService(params.prescriptionId);
        res.status(200).json({
            success: true,
            message: "History retrieved.",
            data,
        });
    } catch (e) {
        handleError(e, res, "getHistoryController");
    }
};

export const upsertHistoryController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const params = parseParams(res, req.params.prescriptionId);
        if (!params) return;
        const parsed = historySchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }
        const { userId, role } = req.user!;
        const data = await svc.upsertHistoryService(
            params.prescriptionId,
            parsed.data,
            userId,
            role as Role,
        );
        res.status(200).json({
            success: true,
            message: "History saved.",
            data,
        });
    } catch (e) {
        handleError(e, res, "upsertHistoryController");
    }
};

// ── BMI (upsert — no list/delete) ─────────────────────────────────────────────

export const getBmiRecordController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const params = parseParams(res, req.params.prescriptionId);
        if (!params) return;
        const data = await svc.getBmiRecordService(params.prescriptionId);
        res.status(200).json({
            success: true,
            message: "BMI record retrieved.",
            data,
        });
    } catch (e) {
        handleError(e, res, "getBmiRecordController");
    }
};

export const upsertBmiRecordController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const params = parseParams(res, req.params.prescriptionId);
        if (!params) return;
        const parsed = bmiRecordSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }
        const { userId, role } = req.user!;
        const data = await svc.upsertBmiRecordService(
            params.prescriptionId,
            parsed.data,
            userId,
            role as Role,
        );
        res.status(200).json({
            success: true,
            message: "BMI record saved.",
            data,
        });
    } catch (e) {
        handleError(e, res, "upsertBmiRecordController");
    }
};
