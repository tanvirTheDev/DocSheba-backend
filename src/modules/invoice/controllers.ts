/** @format */

import { Request, Response } from "express";
import {
    ListInvoicesQuerySchema,
    UpdateInvoiceSchema,
    IdParamSchema,
} from "./schema";
import { InvoiceService } from "./services";
import { formatZodError, notFound } from "../../utils/response";

export const InvoiceController = {
    // GET /invoices
    async listInvoices(req: Request, res: Response) {
        try {
            const query = ListInvoicesQuerySchema.safeParse(req.query);
            if (!query.success) {
                return res.status(400).json(formatZodError(query.error));
            }

            const requesterId = (req as any).user?.id as string;
            const isSuperAdmin = (req as any).user?.role === "SUPER_ADMIN";

            const result = await InvoiceService.listInvoices(
                query.data,
                requesterId,
                isSuperAdmin,
            );
            return res.status(200).json(result);
        } catch (err) {
            console.error("[Invoice] listInvoices:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    // GET /invoices/:id
    async getInvoiceById(req: Request, res: Response) {
        try {
            const params = IdParamSchema.safeParse(req.params);
            if (!params.success) {
                return res.status(400).json(formatZodError(params.error));
            }

            const requesterId = (req as any).user?.id as string;
            const isSuperAdmin = (req as any).user?.role === "SUPER_ADMIN";

            const invoice = await InvoiceService.getInvoiceById(
                params.data.id,
                requesterId,
                isSuperAdmin,
            );
            if (!invoice) return notFound(res, "Invoice not found");

            return res.status(200).json(invoice);
        } catch (err) {
            console.error("[Invoice] getInvoiceById:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    // PATCH /invoices/:id  [SUPER_ADMIN]
    async updateInvoice(req: Request, res: Response) {
        try {
            const params = IdParamSchema.safeParse(req.params);
            if (!params.success) {
                return res.status(400).json(formatZodError(params.error));
            }

            const body = UpdateInvoiceSchema.safeParse(req.body);
            if (!body.success) {
                return res.status(400).json(formatZodError(body.error));
            }

            const invoice = await InvoiceService.updateInvoice(
                params.data.id,
                body.data,
            );
            return res.status(200).json(invoice);
        } catch (err: any) {
            if (err?.code === "NOT_FOUND") {
                return notFound(res, err.message);
            }
            if (err?.code === "P2002") {
                return res.status(409).json({
                    message: "A record with this transaction ID already exists",
                });
            }
            console.error("[Invoice] updateInvoice:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    },
};
