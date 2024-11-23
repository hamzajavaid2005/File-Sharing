import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

// Load environment variables

dotenv.config();

// Configuration

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            throw new Error("Local file path is required");
        }

        if (!fs.existsSync(localFilePath)) {
            throw new Error("File not found at path: " + localFilePath);
        }

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        fs.unlinkSync(localFilePath); // Remove the local file after upload
        return response;
    } catch (error) {
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath); // Cleanup if error occurs
        }
        throw new Error(`Cloudinary upload error: ${error.message}`);
    }
};

// Delete from Cloudinary

const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) {
            console.error("No public_id provided for deletion");
            return false;
        }

        // Try deleting as image first, then as raw if that fails
        try {
            const result = await cloudinary.uploader.destroy(publicId, {
                resource_type: 'image'
            });
            console.log("Cloudinary deletion result:", result);
            if (result.result === "ok" || result.result === "not found") {
                return true;
            }
        } catch (error) {
            // If image deletion fails, try as raw
            if (error.http_code === 400) {
                const result = await cloudinary.uploader.destroy(publicId, {
                    resource_type: 'raw'
                });
                console.log("Cloudinary deletion result (raw):", result);
                if (result.result === "ok" || result.result === "not found") {
                    return true;
                }
            } else {
                throw error; // Re-throw if it's not a resource type error
            }
        }
        return false;
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
        return false;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
