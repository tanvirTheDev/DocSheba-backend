/** @format */

import { Response } from "express";
import { ZodError } from "zod";

export function formatZodError(error: ZodError) {
    return {
        message: "Validation failed",
        errors: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
        })),
    };
}

export function notFound(res: Response, message = "Resource not found") {
    return res.status(404).json({ message });
}

export function conflict(res: Response, message = "Conflict") {
    return res.status(409).json({ message });
}
