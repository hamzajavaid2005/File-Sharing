import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { uploadFile, deleteFile } from "../controllers/upload.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply JWT verification to all routes
router.use(verifyJWT);

// Upload route with multer middleware
router.post("/upload", upload.single("file"), uploadFile);

// Delete route
router.delete("/delete", deleteFile);

export default router;
