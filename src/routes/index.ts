/** @format */

import { Router } from "express";

import appointmentRoutes from "../modules/appointments/routes";
import authRoutes from "../modules/auth/routes";
import userRoutes from "../modules/users/routes";
import patientRoutes from "../modules/patients/routes";
import doctorRoutes from "../modules/doctorsProfile/routes";
import prescriptionsRoutes from "../modules/presctiptions/routes";
// add others as needed...

const router = Router();

// mount all module routes
router.use("/appointments", appointmentRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/patients", patientRoutes);
router.use("/doctors", doctorRoutes);
router.use("/prescriptions", prescriptionsRoutes);

//drug
//

export default router;
