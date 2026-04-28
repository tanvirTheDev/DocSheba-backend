/** @format */

import { Router } from "express";
import { InvoiceController } from "./controllers";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { Role } from "../../generated/prisma/enums";

const router = Router();

router.use(authenticate);

// Admins see own; SUPER_ADMIN sees all (handled inside service)
router.get("/", InvoiceController.listInvoices);
router.get("/:id", InvoiceController.getInvoiceById);

// Mark invoice as paid — SUPER_ADMIN only
router.patch(
    "/:id",
    authorize(Role.SUPER_ADMIN),
    InvoiceController.updateInvoice,
);

export default router;
