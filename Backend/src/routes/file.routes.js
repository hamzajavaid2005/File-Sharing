import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/jwt.middleware.js";
import {
    uploadFile,
    getAllFiles,
    updateFile,
    deleteFile,
} from "../controllers/file.controller.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyJWT);

// File routes
router.post("/upload", upload.single("file"), uploadFile);

router.get("/all", getAllFiles);

router.put("/update/:fileId", upload.single("file"), updateFile);

router.delete("/delete/:fileId", deleteFile);

export default router;
