import express from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import {
    registerUser,
    login,
    verifyEmail,
    resendVerification,
    verifyLoginCode,
    resendLoginCode,
    logoutUser,
    refreshToken,
    updateUserProfile,
    verifyToken,
    getCurrentUser
} from "../controllers/user.controller.js";

const router = express.Router();

// Public routes
router.route("/register").post(registerUser);
router.route("/login").post(login);
router.route("/verify-email").post(verifyEmail);
router.route("/resend-verification").post(resendVerification);
router.route("/verify-login").post(verifyLoginCode);
router.route("/resend-login-code").post(resendLoginCode);
router.route("/refresh-token").post(refreshToken);
router.route("/logout").post(verifyJWT, logoutUser);

// Protected routes (require authentication)
router.route("/verify-token").get(verifyJWT, verifyToken);
router.route("/profile/update").patch(verifyJWT, updateUserProfile);
router.route("/me").get(verifyJWT, getCurrentUser);

export default router;
