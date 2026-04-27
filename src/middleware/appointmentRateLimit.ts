// /** @format */

// import rateLimit from "express-rate-limit";

// // ── IP-based: max 10 appointment creations per hour per IP ───────────────────
// export const appointmentIpRateLimit = rateLimit({
//     windowMs: 60 * 60 * 1000, // 1 hour
//     max: 10,
//     standardHeaders: true,
//     legacyHeaders: false,
//     keyGenerator: (req) => req.ip ?? "unknown",
//     message: {
//         success: false,
//         message: "Too many appointment requests from this IP. Try again later.",
//     },
// });

// import { Request, Response, NextFunction } from "express";
// import { prisma } from "../services/prisma";
// import { AppointmentStatus } from "../generated/prisma";

// const MAX_BOOKINGS_PER_USER_PER_DAY = 5;

// export const appointmentUserRateLimit = async (
//     req: Request,
//     res: Response,
//     next: NextFunction,
// ): Promise<void> => {
//     try {
//         const requesterId = req.user?.userId; // from JWT middleware
//         if (!requesterId) {
//             res.status(401).json({ success: false, message: "Unauthorized." });
//             return;
//         }

//         const dayStart = new Date();
//         dayStart.setHours(0, 0, 0, 0);
//         const dayEnd = new Date();
//         dayEnd.setHours(23, 59, 59, 999);

//         const todayBookingCount = await prisma.appointment.count({
//             where: {
//                 bookedById: requesterId,
//                 createdAt: { gte: dayStart, lte: dayEnd },
//                 status: {
//                     notIn: [
//                         AppointmentStatus.CANCELLED,
//                         AppointmentStatus.NO_SHOW,
//                     ],
//                 },
//             },
//         });

//         if (todayBookingCount >= MAX_BOOKINGS_PER_USER_PER_DAY) {
//             res.status(429).json({
//                 success: false,
//                 message: `You can only book ${MAX_BOOKINGS_PER_USER_PER_DAY} appointments per day.`,
//             });
//             return;
//         }

//         next();
//     } catch (error) {
//         next(error);
//     }
// };
