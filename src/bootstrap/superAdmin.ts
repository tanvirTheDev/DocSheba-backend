/** @format */

import { prisma } from "../lib/prisma";
import { Role, AccountStatus } from "../generated/prisma/enums";
import { hashPassword } from "../utils/token";

export async function bootstrapSuperAdmin(): Promise<void> {
    try {
        const email = process.env.SUPER_ADMIN_EMAIL;
        const password = process.env.SUPER_ADMIN_PASSWORD;
        const name = process.env.SUPER_ADMIN_NAME ?? "Super Admin";

        if (!email || !password) {
            console.warn(
                "[bootstrap] SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set — skipping.",
            );
            return;
        }

        const existing = await prisma.user.findFirst({
            where: { role: Role.SUPER_ADMIN },
            select: { id: true, email: true },
        });

        if (existing) {
            console.log(
                `[bootstrap] Super admin already exists (${existing.email}) — skipping.`,
            );
            return;
        }

        const hashedPassword = await hashPassword(password);

        const admin = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: Role.SUPER_ADMIN,
                status: AccountStatus.ACTIVE,
                verified: true,
            },
            select: {
                id: true,
                email: true,
                role: true,
                name: true,
            },
        });

        console.log(
            `[bootstrap] ✅ Super admin created — email: ${admin.email}, name: ${admin.name}`,
        );
    } catch (error) {
        console.error("[bootstrap] Failed to create super admin:", error);
    }
}
