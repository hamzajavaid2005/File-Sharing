import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import {
    sendVerificationEmail,
    sendWelcomeEmail,
} from "../utils/emailService.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            error.message || "Something went wrong while generating tokens"
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, name } = req.body;

    // Validation
    if (!username || !email || !password || !name) {
        throw new ApiError(400, "All fields are required");
    }

    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existingUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    // Create user with unverified email
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password,
        name,
        isEmailVerified: false,
    });

    // Send verification email
    try {
        await sendVerificationEmail(email);

        return res.status(201).json(
            new ApiResponse(
                201,
                {
                    user: {
                        _id: user._id,
                        email: user.email,
                        username: user.username,
                        name: user.name,
                    },
                },
                "Registration successful! Please check your email for verification code."
            )
        );
    } catch (error) {
        // If email sending fails, delete the created user
        await User.findByIdAndDelete(user._id);
        throw new ApiError(
            500,
            "Failed to send verification email. Please try again."
        );
    }
});

const verifyEmail = asyncHandler(async (req, res) => {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
        throw new ApiError(400, "Email and verification code are required");
    }

    try {
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Verify the code
        await user.verifyEmailCode(verificationCode);

        // Set email as verified
        user.isEmailVerified = true;
        await user.save({ validateBeforeSave: false });

        // Generate tokens
        const { accessToken, refreshToken } =
            await generateAccessAndRefreshTokens(user._id);

        // Send welcome email
        try {
            await sendWelcomeEmail(email, user.name);
        } catch (error) {
            console.error("Failed to send welcome email:", error);
            // Don't throw error here as verification is already complete
        }

        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            path: "/",
        };

        // Send success response with tokens
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: {
                            _id: user._id,
                            email: user.email,
                            username: user.username,
                            name: user.name,
                            isEmailVerified: true,
                        },
                        accessToken,
                        refreshToken,
                    },
                    "Email verified successfully!"
                )
            );
    } catch (error) {
        throw new ApiError(400, error.message || "Email verification failed");
    }
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Always send verification code on login attempt
    try {
        await sendVerificationEmail(email);

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    email: user.email,
                    requiresVerification: true,
                },
                "Verification code sent to your email. Please verify to continue."
            )
        );
    } catch (error) {
        throw new ApiError(
            500,
            "Failed to send verification code. Please try again."
        );
    }
});

const verifyLoginCode = asyncHandler(async (req, res) => {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
        throw new ApiError(400, "Email and verification code are required");
    }

    try {
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Verify the code
        await user.verifyEmailCode(verificationCode);

        // Generate tokens after successful verification
        const { accessToken, refreshToken } =
            await generateAccessAndRefreshTokens(user._id);

        const loggedInUser = await User.findById(user._id).select(
            "-password -refreshToken"
        );

        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            path: "/",
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser,
                        accessToken,
                        refreshToken,
                    },
                    "Login successful!"
                )
            );
    } catch (error) {
        throw new ApiError(400, error.message || "Login verification failed");
    }
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"));
});

const getProtectedData = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id).select(
        "-password -refreshToken"
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { user },
                "Protected data retrieved successfully"
            )
        );
});

const updateUserProfile = asyncHandler(async (req, res) => {
    const { name, email } = req.body;

    if (!name && !email) {
        throw new ApiError(400, "At least one field (name or email) is required for update");
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check if new email already exists for another user
    if (email && email !== user.email) {
        const emailExists = await User.findOne({ email, _id: { $ne: user._id } });
        if (emailExists) {
            throw new ApiError(409, "Email already in use by another account");
        }
        
        // If email is being changed, require reverification
        user.isEmailVerified = false;
        user.email = email;
        
        // Send verification email to new address
        try {
            await sendVerificationEmail(email);
        } catch (error) {
            throw new ApiError(500, "Failed to send verification email to new address");
        }
    }

    if (name) {
        user.name = name;
    }

    await user.save({ validateBeforeSave: false });

    // Remove sensitive information
    const updatedUser = await User.findById(user._id).select("-password -refreshToken");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { user: updatedUser },
                email && email !== user.email
                    ? "Profile updated successfully. Please verify your new email address."
                    : "Profile updated successfully"
            )
        );
});

export {
    registerUser,
    verifyEmail,
    loginUser,
    verifyLoginCode,
    logoutUser,
    getProtectedData,
    updateUserProfile,
};
