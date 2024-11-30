import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        let token = null;

        // First try to get from authorization header
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
            console.log("Found token in Authorization header");
        }

        // If no token in header, try cookies
        if (!token && req.cookies?.accessToken) {
            // Make sure we're getting the token as a string
            token = req.cookies.accessToken;
            if (typeof token === 'object') {
                token = null; // Reset if it's an object
            }
            console.log("Cookie token type:", typeof token);
        }

        // Debug logging
        console.log("Final token value type:", typeof token);
        console.log("Token present:", !!token);

        if (!token) {
            throw new ApiError(401, "Please login to access this resource");
        }

        try {
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            console.log("Token verified successfully");

            const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
            if (!user) {
                throw new ApiError(401, "User not found");
            }

            req.user = user;
            next();
        } catch (jwtError) {
            console.error("JWT Error:", jwtError.message);
            if (jwtError.name === 'TokenExpiredError') {
                throw new ApiError(401, "Token has expired, please login again");
            }
            throw new ApiError(401, "Invalid token, please login again");
        }
    } catch (error) {
        throw new ApiError(
            error.statusCode || 401,
            error.message || "Authentication failed"
        );
    }
});
