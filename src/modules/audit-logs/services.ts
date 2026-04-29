/** @format */

import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { CreateAuditLogInput, ListAuditLogsInput } from "./schema";

export async function listAuditLogs(input: ListAuditLogsInput) {
    const { page, limit, userId, action, tableName, from, to } = input;
    const skip = (page - 1) * limit;

    const where = {
        ...(userId && { userId }),
        ...(action && { action }),
        ...(tableName && { tableName }),
        ...((from || to) && {
            createdAt: {
                ...(from && { gte: from }),
                ...(to && { lte: to }),
            },
        }),
    };

    const [total, data] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        }),
    ]);

    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export async function getAuditLogById(id: string) {
    return prisma.auditLog.findUnique({
        where: { id },
        include: {
            user: {
                select: { id: true, name: true, email: true },
            },
        },
    });
}

export async function createAuditLog(input: CreateAuditLogInput) {
    return prisma.auditLog.create({
        data: {
            userId: input.userId,
            action: input.action,
            tableName: input.tableName,
            recordId: input.recordId,
            changes: (input.changes as Prisma.InputJsonValue) ?? Prisma.DbNull,
        },
    });
}
