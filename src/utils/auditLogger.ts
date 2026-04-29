/** @format */

import { createAuditLog } from "../modules/audit-logs/services";
import { AuditAction } from "../modules/audit-logs/schema";

export async function audit(
    userId: string,
    action: AuditAction,
    tableName: string,
    recordId?: string,
    changes?: Record<string, unknown>,
) {
    // Fire-and-forget — audit failures should never break the main flow
    createAuditLog({ userId, action, tableName, recordId, changes }).catch(
        (err) => console.error("[AuditLog] Failed to write:", err),
    );
}
