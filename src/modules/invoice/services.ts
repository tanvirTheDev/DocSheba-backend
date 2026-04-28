/** @format */

import { prisma } from "../../lib/prisma";
import type { ListInvoicesQuery, UpdateInvoiceInput } from "./schema";

export const InvoiceService = {
    async listInvoices(
        query: ListInvoicesQuery,
        requesterId: string,
        isSuperAdmin: boolean,
    ) {
        const { page, limit, subscriptionId, status } = query;
        const skip = (page - 1) * limit;

        const where: Record<string, any> = {};

        if (status) where.status = status;
        if (subscriptionId) where.subscriptionId = subscriptionId;

        // Non-super-admins only see their own invoices
        if (!isSuperAdmin) {
            where.subscription = { userId: requesterId };
        }

        const [data, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                skip,
                take: limit,
                include: {
                    subscription: { select: { userId: true, planId: true } },
                },
                orderBy: { issuedAt: "desc" },
            }),
            prisma.invoice.count({ where }),
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
    },

    async getInvoiceById(
        id: string,
        requesterId: string,
        isSuperAdmin: boolean,
    ) {
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { subscription: true },
        });

        if (!invoice) return null;

        // Non-super-admins can only see their own invoices
        if (!isSuperAdmin && invoice.subscription.userId !== requesterId) {
            return null; // treat as not found to avoid leaking IDs
        }

        return invoice;
    },

    async updateInvoice(id: string, data: UpdateInvoiceInput) {
        const invoice = await prisma.invoice.findUnique({ where: { id } });

        if (!invoice) {
            const err = new Error("Invoice not found");
            (err as any).code = "NOT_FOUND";
            throw err;
        }

        return prisma.invoice.update({
            where: { id },
            data: {
                status: data.status,
                transactionId: data.transactionId,
                method: data.method,
                paidAt: data.paidAt,
            },
        });
    },
};
