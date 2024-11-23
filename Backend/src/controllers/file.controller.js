import { v4 as uuidv4 } from "uuid"; // To generate a unique identifier for the file
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js"; // Helper to handle Cloudinary uploads
import { File } from "../models/file.model.js"; // File model

// Upload a file
const uploadFile = asyncHandler(async (req, res) => {
    try {
        // Get the file from the request
        const file = req.file;

        // Check if the file exists
        if (!file) {
            throw new ApiError(400, "File is required");
        }

        console.log("Uploading file:", file.path); // Debug log

        // Generate a unique name by appending a UUID to the original file name
        const uniqueName = `${uuidv4()}-${file.originalname}`;

        // Upload the file to Cloudinary
        let cloudinaryResponse;
        try {
            cloudinaryResponse = await uploadOnCloudinary(file.path);
            console.log("Cloudinary Response:", cloudinaryResponse); // Debug log
        } catch (error) {
            console.error("Cloudinary upload error:", error);
            throw new ApiError(
                500,
                `Failed to upload file to Cloudinary: ${error.message}`
            );
        }

        // Ensure the Cloudinary upload was successful
        if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
            throw new ApiError(500, "Failed to get upload URL from Cloudinary");
        }

        // Save the file details in the database with the unique name and sharable link
        const fileData = await File.create({
            name: uniqueName, // Use the unique name generated
            url: cloudinaryResponse.secure_url, // This is the sharable, secure link
            size: cloudinaryResponse.bytes,
            public_id: cloudinaryResponse.public_id,
            owner: req.user._id, // Assuming `req.user` contains the authenticated user's info
        });

        // Return a success response with the sharable link
        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    { fileData, sharableLink: cloudinaryResponse.secure_url },
                    "File uploaded and saved successfully"
                )
            );
    } catch (error) {
        console.error("File upload error:", error);
        throw error;
    }
});

// Get all files
const getAllFiles = asyncHandler(async (req, res) => {
    try {
        const files = await File.find({ owner: req.user._id }); // Assuming `req.user` contains the authenticated user's info
        return res
            .status(200)
            .json(new ApiResponse(200, files, "Files fetched successfully"));
    } catch (error) {
        console.error("Error fetching files:", error);
        throw new ApiError(500, "Failed to fetch files");
    }
});

// Update a file
const updateFile = asyncHandler(async (req, res) => {
    const fileLocalPath = req.file?.path;

    if (!fileLocalPath) {
        throw new ApiError(400, "File is required");
    }

    // Find the file to update first
    const file = await File.findById(req.params.fileId);

    if (!file) {
        throw new ApiError(404, "File not found");
    }

    // Upload the new file to Cloudinary
    let uploadFile;
    try {
        uploadFile = await uploadOnCloudinary(fileLocalPath);
        if (!uploadFile?.secure_url) {
            throw new ApiError(500, "Error while uploading file to Cloudinary");
        }
    } catch (error) {
        console.error("Error uploading new file:", error);
        throw new ApiError(500, "Error uploading new file to Cloudinary");
    }

    // Delete the old file from Cloudinary if it exists
    if (file.public_id) {
        try {
            console.log(
                "Attempting to delete file with public_id:",
                file.public_id
            );
            const deletingFileFromCloudinary = await deleteFromCloudinary(
                file.public_id
            );

            if (!deletingFileFromCloudinary) {
                // If we can't delete the old file but have a new one uploaded,
                // we should still proceed with the update
                console.warn(
                    "Warning: Could not delete old file from Cloudinary:",
                    file.public_id
                );
            }
        } catch (error) {
            console.error("Error while trying to delete old file:", error);
        }
    }

    // Generate a new unique name for the file
    const uniqueName = `${uuidv4()}-${req.file.originalname}`;

    // Update the file's information in the database
    file.url = uploadFile.secure_url; // Save the new secure URL (sharable link)
    file.public_id = uploadFile.public_id;
    file.name = uniqueName; // Use unique name for the updated file
    file.size = req.file.size;

    await file.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { file, sharableLink: uploadFile.secure_url },
                "File updated successfully"
            )
        );
});

// Delete a file
const deleteFile = asyncHandler(async (req, res) => {
    try {
        const { fileId } = req.params;
        const fileToDelete = await File.findById(fileId);

        if (!fileToDelete) {
            throw new ApiError(404, "File not found");
        }

        // Delete the file from Cloudinary
        const deleteCloudinaryResponse = await deleteFromCloudinary(
            fileToDelete.public_id
        );

        if (!deleteCloudinaryResponse) {
            throw new ApiError(500, "Failed to delete file from Cloudinary");
        }

        // Delete the file from the database
        await fileToDelete.remove();

        return res
            .status(200)
            .json(new ApiResponse(200, null, "File deleted successfully"));
    } catch (error) {
        console.error("Error deleting file:", error);
        throw new ApiError(500, "Failed to delete file");
    }
});

// Export the functions
export { uploadFile, getAllFiles, updateFile, deleteFile };
