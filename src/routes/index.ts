/** @format */

import { Router } from "express";

import appointmentRoutes from "../modules/appointments/routes";
import authRoutes from "../modules/auth/routes";
import userRoutes from "../modules/users/routes";
import patientRoutes from "../modules/patients/routes";
import doctorRoutes from "../modules/doctors/routes";
import prescriptionsRoutes from "../modules/presctiptions/routes";
import drugsRoutes from "../modules/drug/routes";
import templateRoutes from "../modules/templates/routes";
import saasPlanRoutes from "../modules/saas-plan/routes";
import subscriptionRoutes from "../modules/subscription/routes";
import invoiceRoutes from "../modules/invoice/routes";
import auditLogRoutes from "../modules/audit-logs/routes";
import { agentRouter, referralRouter } from "../modules/referrals/routes";

const router = Router();

// mount all module routes
router.use("/appointments", appointmentRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/patients", patientRoutes);
router.use("/doctors", doctorRoutes);
router.use("/prescriptions", prescriptionsRoutes);
router.use("/drugs", drugsRoutes);
router.use("/templates", templateRoutes);
router.use("/saas/plans", saasPlanRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/referral-agents", agentRouter);
router.use("/referrals", referralRouter);
router.use("/audit-logs", auditLogRoutes);
export default router;
