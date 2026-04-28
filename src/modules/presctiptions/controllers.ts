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
        const { userId, role } = req.user!;
        const data = await svc.createPrescriptionService(
            parsed.data,
            userId,
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
// CHIEF COMPLAINT CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════════

export const chiefComplaintControllers = {
    list: async (req: Request, res: Response): Promise<void> => {
        try {
            const params = parseParams(res, req.params.prescriptionId);
            if (!params) return;
            const data = await svc.listChiefComplaintsService(
                params.prescriptionId,
            );
            res.status(200).json({
                success: true,
                message: "ChiefComplaint retrieved.",
                data,
            });
        } catch (e) {
            handleError(e, res, "listChiefComplaintController");
        }
    },
    add: async (req: Request, res: Response): Promise<void> => {
        try {
            const params = parseParams(res, req.params.prescriptionId);
            if (!params) return;
            const parsed = chiefComplaintSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(422).json({
                    success: false,
                    message: "Validation failed.",
                    errors: parsed.error!.flatten().fieldErrors,
                });
                return;
            }
            const { id, role } = req.user!;
            const data = await svc.addChiefComplaintService(
                params.prescriptionId,
                parsed.data,
                id,
                role as Role,
            );
            res.status(201).json({
                success: true,
                message: "ChiefComplaint added.",
                data,
            });
        } catch (e) {
            handleError(e, res, "addChiefComplaintController");
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
            const parsed = updateChiefComplaintSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(422).json({
                    success: false,
                    message: "Validation failed.",
                    errors: parsed.error!.flatten().fieldErrors,
                });
                return;
            }
            const { id, role } = req.user!;
            const data = await svc.updateChiefComplaintService(
                params.prescriptionId,
                params.itemId!,
                parsed.data,
                id,
                role as Role,
            );
            res.status(200).json({
                success: true,
                message: "ChiefComplaint updated.",
                data,
            });
        } catch (e) {
            handleError(e, res, "updateChiefComplaintController");
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
            const result = await svc.deleteChiefComplaintService(
                params.prescriptionId,
                params.itemId!,
                id,
                role as Role,
            );
            res.status(200).json({ success: true, ...(result as object) });
        } catch (e) {
            handleError(e, res, "deleteChiefComplaintController");
        }
    },
};

// ══════════════════════════════════════════════════════════════════════════════
// EXAMINATION CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════════

export const examinationControllers = {
    list: async (req: Request, res: Response): Promise<void> => {
        try {
            const params = parseParams(res, req.params.prescriptionId);
            if (!params) return;
            const data = await svc.listExaminationsService(
                params.prescriptionId,
            );
            res.status(200).json({
                success: true,
                message: "Examination retrieved.",
                data,
            });
        } catch (e) {
            handleError(e, res, "listExaminationController");
        }
    },
    add: async (req: Request, res: Response): Promise<void> => {
        try {
            const params = parseParams(res, req.params.prescriptionId);
            if (!params) return;
            const parsed = examinationSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(422).json({
                    success: false,
                    message: "Validation failed.",
                    errors: parsed.error!.flatten().fieldErrors,
                });
                return;
            }
            const { id, role } = req.user!;
            const data = await svc.addExaminationService(
                params.prescriptionId,
                parsed.data,
                id,
                role as Role,
            );
            res.status(201).json({
                success: true,
                message: "Examination added.",
                data,
            });
        } catch (e) {
            handleError(e, res, "addExaminationController");
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
            const parsed = examinationSchema.safeParse(req.body); // reuses add schema — supply updateExaminationSchema if it exists
            if (!parsed.success) {
                res.status(422).json({
                    success: false,
                    message: "Validation failed.",
                    errors: parsed.error!.flatten().fieldErrors,
                });
                return;
            }
            const { id, role } = req.user!;
            const data = await svc.updateExaminationService(
                params.prescriptionId,
                params.itemId!,
                parsed.data,
                id,
                role as Role,
            );
            res.status(200).json({
                success: true,
                message: "Examination updated.",
                data,
            });
        } catch (e) {
            handleError(e, res, "updateExaminationController");
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
            const result = await svc.deleteExaminationService(
                params.prescriptionId,
                params.itemId!,
                id,
                role as Role,
            );
            res.status(200).json({ success: true, ...(result as object) });
        } catch (e) {
            handleError(e, res, "deleteExaminationController");
        }
    },
};

// ══════════════════════════════════════════════════════════════════════════════
// DIAGNOSIS CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════════

export const diagnosisControllers = {
    list: async (req: Request, res: Response): Promise<void> => {
        try {
            const params = parseParams(res, req.params.prescriptionId);
            if (!params) return;
            const data = await svc.listDiagnosesService(params.prescriptionId);
            res.status(200).json({
                success: true,
                message: "Diagnosis retrieved.",
                data,
            });
        } catch (e) {
            handleError(e, res, "listDiagnosisController");
        }
    },
    add: async (req: Request, res: Response): Promise<void> => {
        try {
            const params = parseParams(res, req.params.prescriptionId);
            if (!params) return;
            const parsed = diagnosisSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(422).json({
                    success: false,
                    message: "Validation failed.",
                    errors: parsed.error!.flatten().fieldErrors,
                });
                return;
            }
            const { id, role } = req.user!;
            const data = await svc.addDiagnosisService(
                params.prescriptionId,
                parsed.data,
                id,
                role as Role,
            );
            res.status(201).json({
                success: true,
                message: "Diagnosis added.",
                data,
            });
        } catch (e) {
            handleError(e, res, "addDiagnosisController");
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
            const parsed = updateDiagnosisSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(422).json({
                    success: false,
                    message: "Validation failed.",
                    errors: parsed.error!.flatten().fieldErrors,
                });
                return;
            }
            const { id, role } = req.user!;
            const data = await svc.updateDiagnosisService(
                params.prescriptionId,
                params.itemId!,
                parsed.data,
                id,
                role as Role,
            );
            res.status(200).json({
                success: true,
                message: "Diagnosis updated.",
                data,
            });
        } catch (e) {
            handleError(e, res, "updateDiagnosisController");
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
            const result = await svc.deleteDiagnosisService(
                params.prescriptionId,
                params.itemId!,
                id,
                role as Role,
            );
            res.status(200).json({ success: true, ...(result as object) });
        } catch (e) {
            handleError(e, res, "deleteDiagnosisController");
        }
    },
};

// ══════════════════════════════════════════════════════════════════════════════
// INVESTIGATION CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════════

export const investigationControllers = {
    list: async (req: Request, res: Response): Promise<void> => {
        try {
            const params = parseParams(res, req.params.prescriptionId);
            if (!params) return;
            const data = await svc.listInvestigationsService(
                params.prescriptionId,
            );
            res.status(200).json({
                success: true,
                message: "Investigation retrieved.",
                data,
            });
        } catch (e) {
            handleError(e, res, "listInvestigationController");
        }
    },
    add: async (req: Request, res: Response): Promise<void> => {
        try {
            const params = parseParams(res, req.params.prescriptionId);
            if (!params) return;
            const parsed = investigationSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(422).json({
                    success: false,
                    message: "Validation failed.",
                    errors: parsed.error!.flatten().fieldErrors,
                });
                return;
            }
            const { id, role } = req.user!;
            const data = await svc.addInvestigationService(
                params.prescriptionId,
                parsed.data,
                id,
                role as Role,
            );
            res.status(201).json({
                success: true,
                message: "Investigation added.",
                data,
            });
        } catch (e) {
            handleError(e, res, "addInvestigationController");
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
            const parsed = updateInvestigationSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(422).json({
                    success: false,
                    message: "Validation failed.",
                    errors: parsed.error!.flatten().fieldErrors,
                });
                return;
            }
            const { id, role } = req.user!;
            const data = await svc.updateInvestigationService(
                params.prescriptionId,
                params.itemId!,
                parsed.data,
                id,
                role as Role,
            );
            res.status(200).json({
                success: true,
                message: "Investigation updated.",
                data,
            });
        } catch (e) {
            handleError(e, res, "updateInvestigationController");
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
            const result = await svc.deleteInvestigationService(
                params.prescriptionId,
                params.itemId!,
                id,
                role as Role,
            );
            res.status(200).json({ success: true, ...(result as object) });
        } catch (e) {
            handleError(e, res, "deleteInvestigationController");
        }
    },
};

// ══════════════════════════════════════════════════════════════════════════════
// RX ITEM CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════════

export const rxItemControllers = {
    list: async (req: Request, res: Response): Promise<void> => {
        try {
            const params = parseParams(res, req.params.prescriptionId);
            if (!params) return;
            const data = await svc.listRxItemsService(params.prescriptionId);
            res.status(200).json({
                success: true,
                message: "RxItem retrieved.",
                data,
            });
        } catch (e) {
            handleError(e, res, "listRxItemController");
        }
    },
    add: async (req: Request, res: Response): Promise<void> => {
        try {
            const params = parseParams(res, req.params.prescriptionId);
            if (!params) return;
            const parsed = rxItemSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(422).json({
                    success: false,
                    message: "Validation failed.",
                    errors: parsed.error!.flatten().fieldErrors,
                });
                return;
            }
            const { id, role } = req.user!;
            const data = await svc.addRxItemService(
                params.prescriptionId,
                parsed.data,
                id,
                role as Role,
            );
            res.status(201).json({
                success: true,
                message: "RxItem added.",
                data,
            });
        } catch (e) {
            handleError(e, res, "addRxItemController");
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
            const parsed = updateRxItemSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(422).json({
                    success: false,
                    message: "Validation failed.",
                    errors: parsed.error!.flatten().fieldErrors,
                });
                return;
            }
            const { id, role } = req.user!;
            const data = await svc.updateRxItemService(
                params.prescriptionId,
                params.itemId!,
                parsed.data,
                id,
                role as Role,
            );
            res.status(200).json({
                success: true,
                message: "RxItem updated.",
                data,
            });
        } catch (e) {
            handleError(e, res, "updateRxItemController");
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
            const result = await svc.deleteRxItemService(
                params.prescriptionId,
                params.itemId!,
                id,
                role as Role,
            );
            res.status(200).json({ success: true, ...(result as object) });
        } catch (e) {
            handleError(e, res, "deleteRxItemController");
        }
    },
};

// ══════════════════════════════════════════════════════════════════════════════
// ADVICE CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════════

export const adviceControllers = {
    list: async (req: Request, res: Response): Promise<void> => {
        try {
            const params = parseParams(res, req.params.prescriptionId);
            if (!params) return;
            const data = await svc.listAdviceService(params.prescriptionId);
            res.status(200).json({
                success: true,
                message: "Advice retrieved.",
                data,
            });
        } catch (e) {
            handleError(e, res, "listAdviceController");
        }
    },
    add: async (req: Request, res: Response): Promise<void> => {
        try {
            const params = parseParams(res, req.params.prescriptionId);
            if (!params) return;
            const parsed = adviceSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(422).json({
                    success: false,
                    message: "Validation failed.",
                    errors: parsed.error!.flatten().fieldErrors,
                });
                return;
            }
            const { id, role } = req.user!;
            const data = await svc.addAdviceService(
                params.prescriptionId,
                parsed.data,
                id,
                role as Role,
            );
            res.status(201).json({
                success: true,
                message: "Advice added.",
                data,
            });
        } catch (e) {
            handleError(e, res, "addAdviceController");
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
            const parsed = updateAdviceSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(422).json({
                    success: false,
                    message: "Validation failed.",
                    errors: parsed.error!.flatten().fieldErrors,
                });
                return;
            }
            const { id, role } = req.user!;
            const data = await svc.updateAdviceService(
                params.prescriptionId,
                params.itemId!,
                parsed.data,
                id,
                role as Role,
            );
            res.status(200).json({
                success: true,
                message: "Advice updated.",
                data,
            });
        } catch (e) {
            handleError(e, res, "updateAdviceController");
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
            const result = await svc.deleteAdviceService(
                params.prescriptionId,
                params.itemId!,
                id,
                role as Role,
            );
            res.status(200).json({ success: true, ...(result as object) });
        } catch (e) {
            handleError(e, res, "deleteAdviceController");
        }
    },
};

// ══════════════════════════════════════════════════════════════════════════════
// REPORT ENTRY CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════════

export const reportEntryControllers = {
    list: async (req: Request, res: Response): Promise<void> => {
        try {
            const params = parseParams(res, req.params.prescriptionId);
            if (!params) return;
            const data = await svc.listReportEntriesService(
                params.prescriptionId,
            );
            res.status(200).json({
                success: true,
                message: "ReportEntry retrieved.",
                data,
            });
        } catch (e) {
            handleError(e, res, "listReportEntryController");
        }
    },
    add: async (req: Request, res: Response): Promise<void> => {
        try {
            const params = parseParams(res, req.params.prescriptionId);
            if (!params) return;
            const parsed = reportEntrySchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(422).json({
                    success: false,
                    message: "Validation failed.",
                    errors: parsed.error!.flatten().fieldErrors,
                });
                return;
            }
            const { id, role } = req.user!;
            const data = await svc.addReportEntryService(
                params.prescriptionId,
                parsed.data,
                id,
                role as Role,
            );
            res.status(201).json({
                success: true,
                message: "ReportEntry added.",
                data,
            });
        } catch (e) {
            handleError(e, res, "addReportEntryController");
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
            const parsed = updateReportEntrySchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(422).json({
                    success: false,
                    message: "Validation failed.",
                    errors: parsed.error!.flatten().fieldErrors,
                });
                return;
            }
            const { id, role } = req.user!;
            const data = await svc.updateReportEntryService(
                params.prescriptionId,
                params.itemId!,
                parsed.data,
                id,
                role as Role,
            );
            res.status(200).json({
                success: true,
                message: "ReportEntry updated.",
                data,
            });
        } catch (e) {
            handleError(e, res, "updateReportEntryController");
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
            const result = await svc.deleteReportEntryService(
                params.prescriptionId,
                params.itemId!,
                id,
                role as Role,
            );
            res.status(200).json({ success: true, ...(result as object) });
        } catch (e) {
            handleError(e, res, "deleteReportEntryController");
        }
    },
};

// ══════════════════════════════════════════════════════════════════════════════
// DRUG HISTORY CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════════

export const drugHistoryControllers = {
    list: async (req: Request, res: Response): Promise<void> => {
        try {
            const params = parseParams(res, req.params.prescriptionId);
            if (!params) return;
            const data = await svc.listDrugHistoryService(
                params.prescriptionId,
            );
            res.status(200).json({
                success: true,
                message: "DrugHistory retrieved.",
                data,
            });
        } catch (e) {
            handleError(e, res, "listDrugHistoryController");
        }
    },
    add: async (req: Request, res: Response): Promise<void> => {
        try {
            const params = parseParams(res, req.params.prescriptionId);
            if (!params) return;
            const parsed = drugHistorySchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(422).json({
                    success: false,
                    message: "Validation failed.",
                    errors: parsed.error!.flatten().fieldErrors,
                });
                return;
            }
            const { id, role } = req.user!;
            const data = await svc.addDrugHistoryService(
                params.prescriptionId,
                parsed.data,
                id,
                role as Role,
            );
            res.status(201).json({
                success: true,
                message: "DrugHistory added.",
                data,
            });
        } catch (e) {
            handleError(e, res, "addDrugHistoryController");
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
            const parsed = updateDrugHistorySchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(422).json({
                    success: false,
                    message: "Validation failed.",
                    errors: parsed.error!.flatten().fieldErrors,
                });
                return;
            }
            const { id, role } = req.user!;
            const data = await svc.updateDrugHistoryService(
                params.prescriptionId,
                params.itemId!,
                parsed.data,
                id,
                role as Role,
            );
            res.status(200).json({
                success: true,
                message: "DrugHistory updated.",
                data,
            });
        } catch (e) {
            handleError(e, res, "updateDrugHistoryController");
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
            const result = await svc.deleteDrugHistoryService(
                params.prescriptionId,
                params.itemId!,
                id,
                role as Role,
            );
            res.status(200).json({ success: true, ...(result as object) });
        } catch (e) {
            handleError(e, res, "deleteDrugHistoryController");
        }
    },
};

// ══════════════════════════════════════════════════════════════════════════════
// PLAN CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════════

export const planControllers = {
    list: async (req: Request, res: Response): Promise<void> => {
        try {
            const params = parseParams(res, req.params.prescriptionId);
            if (!params) return;
            const data = await svc.listPlansService(params.prescriptionId);
            res.status(200).json({
                success: true,
                message: "Plan retrieved.",
                data,
            });
        } catch (e) {
            handleError(e, res, "listPlanController");
        }
    },
    add: async (req: Request, res: Response): Promise<void> => {
        try {
            const params = parseParams(res, req.params.prescriptionId);
            if (!params) return;
            const parsed = planSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(422).json({
                    success: false,
                    message: "Validation failed.",
                    errors: parsed.error!.flatten().fieldErrors,
                });
                return;
            }
            const { id, role } = req.user!;
            const data = await svc.addPlanService(
                params.prescriptionId,
                parsed.data,
                id,
                role as Role,
            );
            res.status(201).json({
                success: true,
                message: "Plan added.",
                data,
            });
        } catch (e) {
            handleError(e, res, "addPlanController");
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
            const parsed = updatePlanSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(422).json({
                    success: false,
                    message: "Validation failed.",
                    errors: parsed.error!.flatten().fieldErrors,
                });
                return;
            }
            const { id, role } = req.user!;
            const data = await svc.updatePlanService(
                params.prescriptionId,
                params.itemId!,
                parsed.data,
                id,
                role as Role,
            );
            res.status(200).json({
                success: true,
                message: "Plan updated.",
                data,
            });
        } catch (e) {
            handleError(e, res, "updatePlanController");
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
            const result = await svc.deletePlanService(
                params.prescriptionId,
                params.itemId!,
                id,
                role as Role,
            );
            res.status(200).json({ success: true, ...(result as object) });
        } catch (e) {
            handleError(e, res, "deletePlanController");
        }
    },
};

// ══════════════════════════════════════════════════════════════════════════════
// NOTE CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════════

export const noteControllers = {
    list: async (req: Request, res: Response): Promise<void> => {
        try {
            const params = parseParams(res, req.params.prescriptionId);
            if (!params) return;
            const data = await svc.listNotesService(params.prescriptionId);
            res.status(200).json({
                success: true,
                message: "Note retrieved.",
                data,
            });
        } catch (e) {
            handleError(e, res, "listNoteController");
        }
    },
    add: async (req: Request, res: Response): Promise<void> => {
        try {
            const params = parseParams(res, req.params.prescriptionId);
            if (!params) return;
            const parsed = noteSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(422).json({
                    success: false,
                    message: "Validation failed.",
                    errors: parsed.error!.flatten().fieldErrors,
                });
                return;
            }
            const { id, role } = req.user!;
            const data = await svc.addNoteService(
                params.prescriptionId,
                parsed.data,
                id,
                role as Role,
            );
            res.status(201).json({
                success: true,
                message: "Note added.",
                data,
            });
        } catch (e) {
            handleError(e, res, "addNoteController");
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
            const parsed = updateNoteSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(422).json({
                    success: false,
                    message: "Validation failed.",
                    errors: parsed.error!.flatten().fieldErrors,
                });
                return;
            }
            const { id, role } = req.user!;
            const data = await svc.updateNoteService(
                params.prescriptionId,
                params.itemId!,
                parsed.data,
                id,
                role as Role,
            );
            res.status(200).json({
                success: true,
                message: "Note updated.",
                data,
            });
        } catch (e) {
            handleError(e, res, "updateNoteController");
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
            const result = await svc.deleteNoteService(
                params.prescriptionId,
                params.itemId!,
                id,
                role as Role,
            );
            res.status(200).json({ success: true, ...(result as object) });
        } catch (e) {
            handleError(e, res, "deleteNoteController");
        }
    },
};

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
