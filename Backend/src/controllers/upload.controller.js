import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import asyncHandler from "../utils/asyncHandler.js";

// Upload a file to Cloudinary with FFmpeg processing for videos
export const uploadFile = asyncHandler(async (req, res) => {
    try {
        if (!req.file) {
            throw new ApiError(400, "No file provided");
        }

        // Upload file to Cloudinary (with FFmpeg processing if it's a video)
        const uploadResult = await uploadToCloudinary(req.file);

        return res.status(201).json(
            new ApiResponse(201, uploadResult, "File uploaded successfully")
        );
    } catch (error) {
        console.error("Upload error:", error);
        throw new ApiError(error.statusCode || 500, error.message || "Failed to upload file");
    }
});

// Delete a file from Cloudinary
export const deleteFile = asyncHandler(async (req, res) => {
    const { publicId, resourceType } = req.body;

    if (!publicId) {
        throw new ApiError(400, "Public ID is required");
    }

    const deleted = await deleteFromCloudinary(publicId, resourceType);

    if (!deleted) {
        throw new ApiError(500, "Failed to delete file");
    }

    return res.status(200).json(
        new ApiResponse(200, { publicId }, "File deleted successfully")
    );
});
