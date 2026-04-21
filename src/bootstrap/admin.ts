/** @format */

import { prisma } from "../services/prisma";
import { Role } from "../generated/prisma";
import { generateHash } from "../utils/token";

export async function bootstrapSuperAdmin(): Promise<void> {
    try {
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;
        const fullName = process.env.ADMIN_NAME ?? " Admin";

        // ── Guard: skip if env vars not set ──────────────────────
        if (!email || !password) {
            console.warn(
                "[bootstrap] ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping.",
            );
            return;
        }

        // ── Check on Account table — role lives here now ──────────
        const existing = await prisma.user.findFirst({
            where: { role: Role.ADMIN },
            select: { id: true, email: true },
        });

        if (existing) {
            console.log(
                `[bootstrap] Super admin already exists (${existing.email}) — skipping.`,
            );
            return;
        }

        const hashedPassword = await generateHash(password);

        // ── Create  User profile─────
        const admin = await prisma.user.create({
            data: {
                email,
                fullName,
                password: hashedPassword,
                role: Role.ADMIN,
                isActive: true,
                isEmailVerified: true,
            },
            select: {
                id: true,
                email: true,
                role: true,
                fullName: true,
            },
        });

        console.log(
            `[bootstrap] ✅ Super admin created — email: ${admin.email}, name: ${admin?.fullName}`,
        );
    } catch (error) {
        console.error("[bootstrap] Failed to create super admin:", error);
    }
}
