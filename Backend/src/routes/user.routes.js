import express from "express";
import { verifyJWT } from "../middlewares/jwt.middleware.js";
import {
    registerUser,
    loginUser,
    logoutUser,
    updatePassword,
    updateUserProfile,
    deleteProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

router.route("/register").post(registerUser);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/update-password").post(verifyJWT, updatePassword);

router.route("/update-profile").post(verifyJWT, updateUserProfile);

router.route("/delete-profile").delete(verifyJWT, deleteProfile);

export default router;
