/** @format */

import { cloudinary } from "../config/cloudinary";

export const uploadToCloudinary = (
    buffer: Buffer,
    folder: string,
    publicId: string,
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                public_id: publicId,
                overwrite: true,
                timeout: 10000,
                transformation: [
                    {
                        quality: "auto",
                        fetch_format: "auto",
                    },
                ],
            },
            (error, result) => {
                if (error || !result) {
                    reject(error ?? new Error("Cloudinary upload failed"));
                    return;
                }
                resolve(result.secure_url);
            },
        );

        stream.end(buffer);
    });
};
