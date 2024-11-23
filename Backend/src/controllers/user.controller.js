import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.model.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            error?.message ||
                "Something went wrong while generating access and refresh token !!!"
        );
    }
};

// Register user

const registerUser = asyncHandler(async (req, res) => {
    const { name, username, email, password } = req.body;

    if (!(name && username && email && password)) {
        throw new ApiError(400, "All fields are required !!!");
    }

    const existingUser = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (existingUser) {
        throw new ApiError(
            400,
            "User with this email or username already exists !!!"
        );
    }

    const user = await User.create({
        name,
        username,
        email,
        password,
    });

    if (!user) {
        throw new ApiError(400, "User registration failed !!!");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, user, "User registered successfully !!!"));
});

// Login user

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!(email && password)) {
        throw new ApiError(400, "All fields are required !!!");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User not found !!!");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid credentials !!!");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, loggedInUser, "Login successful !!!"));
});

// Logout user

const logoutUser = asyncHandler(async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user?._id, {
            $set: {
                refreshToken: null,
            },
        });

        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        });

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        });

        return res
            .status(200)
            .json(new ApiResponse(200, null, "User Logout successful !!!"));
    } catch (error) {
        throw new ApiError(
            500,
            error?.message || "Something went wrong while logging out !!!"
        );
    }
});

// Update password

const updatePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!(oldPassword && newPassword)) {
        throw new ApiError(400, "All fields are required !!!");
    }

    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "User not found !!!");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid credentials !!!");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Password updated successfully !!!"));
});

// Update user profile

const updateUserProfile = asyncHandler(async (req, res) => {
    const { name, email } = req.body;

    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "User not found !!!");
    }

    user.name = name;
    user.email = email;

    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "User profile updated successfully !!!")
        );
});

const deleteProfile = asyncHandler(async (req, res) => {
    const userIdToDelete = req.params.userId || req.user._id;

    if (userIdToDelete !== req.user._id && req.user.role !== "admin") {
        throw new ApiError(
            403,
            "Unauthorized: You can only delete your own profile!"
        );
    }

    const userToDelete = await User.findById(userIdToDelete);

    if (!userToDelete) {
        throw new ApiError(404, "User not found!");
    }

    // Delete the user
    await User.findByIdAndDelete(userToDelete._id);
    if (userIdToDelete === req.user._id) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "User deleted successfully!"));
});

export {
    generateAccessAndRefreshTokens,
    registerUser,
    loginUser,
    logoutUser,
    updatePassword,
    updateUserProfile,
    deleteProfile,
};
