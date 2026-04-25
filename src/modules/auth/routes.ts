/** @format */

import { Router } from "express";
import {
    registerController,
    verifyEmailController,
    loginController,
    refreshTokenController,
    logoutController,
    forgotPasswordController,
    resetPasswordController,
    changePasswordController,
    getMeController,
} from "./controller";
import { authenticate } from "../../middleware/authenticate";

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────
router.post("/register", registerController);
router.post("/verify-email", verifyEmailController);
router.post("/login", loginController);
router.post("/refresh", refreshTokenController);
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);

// ─── Protected ────────────────────────────────────────────────────────────────
router.post("/logout", authenticate, logoutController);
router.post("/change-password", authenticate, changePasswordController);
router.get("/me", authenticate, getMeController);

export default router;
