/** @format */

import { Request, Response } from "express";
import { auditLogIdSchema, listAuditLogsSchema } from "./schema";
import * as AuditLogLib from "./services";

export async function listAuditLogs(
    req: Request,
    res: Response,
): Promise<void> {
    const parsed = listAuditLogsSchema.safeParse(req.query);
    if (!parsed.success) {
        res.status(400).json({
            success: false,
            message: "Validation failed.",
            errors: parsed.error.flatten().fieldErrors,
        });
        return;
    }

    const result = await AuditLogLib.listAuditLogs(parsed.data);

    res.json({
        success: true,
        message: "Audit logs fetched successfully.",
        data: result.data,
        meta: result.meta,
    });
}

export async function getAuditLogById(
    req: Request,
    res: Response,
): Promise<void> {
    const parsed = auditLogIdSchema.safeParse(req.params.id);
    if (!parsed.success) {
        res.status(400).json({
            success: false,
            message: "Invalid audit log ID.",
            errors: parsed.error.flatten(),
        });
        return;
    }

    const log = await AuditLogLib.getAuditLogById(parsed.data);
    if (!log) {
        res.status(404).json({
            success: false,
            message: "Audit log not found.",
        });
        return;
    }

    res.json({
        success: true,
        message: "Audit log fetched successfully.",
        data: log,
    });
}
