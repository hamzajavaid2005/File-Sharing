import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.model.js";

export const verifyEmailMiddleware = async (req, res, next) => {
    try {
        const user = await User.findById(req.user?._id);
        
        if (!user) {
            throw new ApiError(401, "Unauthorized request");
        }

        if (!user.isEmailVerified) {
            throw new ApiError(403, "Please verify your email before accessing this resource");
        }

        next();
    } catch (error) {
        next(error);
    }
};
