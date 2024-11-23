import mongoose, { Schema } from "mongoose";

const fileSchema = new Schema(
    {
        name: {
            type: String,
            required: true, // File name (user-provided or original name)
        },
        url: {
            type: String,
            required: true, // Cloudinary URL of the uploaded file
        },
        public_id: {
            type: String,
            required: true, // Cloudinary public ID for file management
        },
        size: {
            type: Number,
            required: true, // File size in bytes
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User", // Reference to the user who uploaded the file
            required: true,
        },
    },
    { timestamps: true } // Automatically manage createdAt and updatedAt
);

const File = mongoose.model("File", fileSchema);

export { File };
