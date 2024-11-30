import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";
import { 
    sendVerificationEmail, 
    sendWelcomeEmail, 
    generateVerificationCode, 
    sendEmail 
} from "../utils/emailService.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

// Rate limiting configuration
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

// Temporary storage for verification codes
const verificationCodes = new Map();
const loginVerificationCodes = new Map();

class RateLimiter {
    static cleanupOldEntries() {
        const now = Date.now();
        for (const [email, data] of loginAttempts.entries()) {
            if (now - data.lastAttempt > LOCK_TIME) {
                loginAttempts.delete(email);
            }
        }
    }

    static clearAttempts(email) {
        loginAttempts.delete(email);
    }

    static incrementAttempts(email) {
        // Cleanup old entries periodically
        if (Math.random() < 0.1) this.cleanupOldEntries();

        const attempts = loginAttempts.get(email) || {
            count: 0,
            lastAttempt: Date.now(),
        };

        if (Date.now() - attempts.lastAttempt > LOCK_TIME) {
            attempts.count = 1;
        } else {
            attempts.count += 1;
        }

        attempts.lastAttempt = Date.now();
        loginAttempts.set(email, attempts);

        return attempts.count;
    }

    static isLocked(email) {
        const attempts = loginAttempts.get(email);
        if (!attempts) return false;

        if (Date.now() - attempts.lastAttempt > LOCK_TIME) {
            loginAttempts.delete(email);
            return false;
        }

        return attempts.count >= MAX_LOGIN_ATTEMPTS;
    }
}

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
            error.message || "Something went wrong while generating tokens"
        );
    }
};

const registerUserController = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Create new user
        user = await User.create({
            email,
            password,
            name
        });

        // Generate verification code
        const verificationCode = user.generateVerificationCode();
        await user.save();

        // TODO: Send verification email
        console.log('Verification code:', verificationCode);

        return res.status(201).json({
            success: true,
            message: 'Registration successful. Please verify your email.',
            data: {
                requiresVerification: true,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
};

const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user and include password field
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate login verification code
        const loginCode = user.generateLoginCode();
        await user.save();

        // TODO: Send login code via email
        console.log('Login code:', loginCode);

        return res.status(200).json({
            success: true,
            data: {
                requiresVerification: true,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
};

const verifyLoginCodeController = async (req, res) => {
    try {
        const { email, code } = req.body;

        // Find user with login code
        const user = await User.findOne({
            email,
            loginCode: code,
            loginCodeExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired verification code'
            });
        }

        // Clear login code
        user.loginCode = undefined;
        user.loginCodeExpires = undefined;

        // Generate tokens
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Save refresh token
        user.refreshToken = refreshToken;
        await user.save();

        return res.status(200).json({
            success: true,
            data: {
                accessToken,
                user: {
                    _id: user._id,
                    email: user.email,
                    name: user.name
                }
            }
        });
    } catch (error) {
        console.error('Login verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Verification failed'
        });
    }
};

const verifyEmailController = async (req, res) => {
    try {
        const { email, code } = req.body;

        // Find user with verification code
        const user = await User.findOne({
            email,
            verificationCode: code,
            verificationCodeExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired verification code'
            });
        }

        // Mark user as verified
        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        console.error('Email verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Verification failed'
        });
    }
};

const resendVerificationController = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate new verification code
        const verificationCode = user.generateVerificationCode();
        await user.save();

        // TODO: Send verification email
        console.log('New verification code:', verificationCode);

        return res.status(200).json({
            success: true,
            message: 'Verification code sent successfully'
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to resend verification code'
        });
    }
};

const resendLoginCodeController = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate new login code
        const loginCode = user.generateLoginCode();
        await user.save();

        // TODO: Send login code via email
        console.log('New login code:', loginCode);

        return res.status(200).json({
            success: true,
            message: 'Login code sent successfully'
        });
    } catch (error) {
        console.error('Resend login code error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to resend login code'
        });
    }
};

const refreshTokenController = async (req, res) => {
    try {
        const { refreshToken: token } = req.body;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

        // Find user with refresh token
        const user = await User.findOne({
            _id: decoded._id,
            refreshToken: token
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Generate new tokens
        const accessToken = user.generateAccessToken();
        const newRefreshToken = user.generateRefreshToken();

        // Update refresh token
        user.refreshToken = newRefreshToken;
        await user.save();

        return res.status(200).json({
            success: true,
            data: {
                accessToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid refresh token'
        });
    }
};

const logoutUserController = async (req, res) => {
    try {
        const user = req.user;

        // Clear refresh token
        user.refreshToken = undefined;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};

const updateUserProfileController = async (req, res) => {
    try {
        const { name } = req.body;
        const user = req.user;

        if (name) {
            user.name = name;
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                _id: user._id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};

const getCurrentUserController = async (req, res) => {
    try {
        const user = req.user;
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get user information'
        });
    }
};

const verifyTokenController = async (req, res) => {
    // If we reach here, the token is valid (verified by middleware)
    return res.status(200).json({
        success: true,
        message: 'Token is valid'
    });
};

export {
    registerUserController as registerUser,
    loginController as login,
    verifyEmailController as verifyEmail,
    resendVerificationController as resendVerification,
    verifyLoginCodeController as verifyLoginCode,
    resendLoginCodeController as resendLoginCode,
    logoutUserController as logoutUser,
    refreshTokenController as refreshToken,
    updateUserProfileController as updateUserProfile,
    verifyTokenController as verifyToken,
    getCurrentUserController as getCurrentUser
};
