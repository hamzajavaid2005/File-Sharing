import express from "express";
import { verifyJWT } from "../middlewares/jwt.middleware.js";
import { verifyEmailMiddleware } from "../middlewares/verifyEmail.middleware.js";
import {
    registerUser,
    verifyEmail,
    loginUser,
    logoutUser,
    verifyLoginCode,
    getProtectedData,
    updateUserProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

// Public routes (no authentication required)
router.route("/register").post(registerUser);
router.route("/verify-email").post(verifyEmail);
router.route("/login").post(loginUser);
router.route("/verify-login").post(verifyLoginCode);

// Protected routes (require authentication and verified email)
router.route("/logout").post(verifyJWT, verifyEmailMiddleware, logoutUser);
router.route("/profile/update").patch(verifyJWT, verifyEmailMiddleware, updateUserProfile);

// Add more protected routes here...
router
    .route("/protected-route")
    .get(verifyJWT, verifyEmailMiddleware, getProtectedData);

export default router;
