/** @format */

import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

// ============================================================
// FILE FILTER - shared across all storage strategies
// ============================================================
const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
): void => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPEG,JPG, PNG, and WebP images are allowed"));
    }
};

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export default upload;
