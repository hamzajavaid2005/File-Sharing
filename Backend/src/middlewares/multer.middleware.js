import multer from "multer";
import { ApiError } from "../utils/ApiError.js";
import path from "path";
import fs from "fs";

// Create uploads directory if it doesn't exist
const uploadsDir = "./public/temp";
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept video files
    if (file.mimetype.startsWith('video/')) {
        return cb(null, true);
    }
    
    // Accept image files
    if (file.mimetype.startsWith('image/')) {
        return cb(null, true);
    }
    
    // Accept common document types
    const allowedDocTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ];
    
    if (allowedDocTypes.includes(file.mimetype)) {
        return cb(null, true);
    }
    
    cb(new ApiError(415, 'Unsupported file type'));
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB in bytes
    }
});
