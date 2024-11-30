import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            required: true,
            unique: true,
            toLowerCase: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            toLowerCase: true,
        },
        password: {
            type: String,
            required: true,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }

    this.password = await bcrypt.hash(this.password, 10);
    return next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = async function () {
    return jwt.sign(
        {
            _id: this._id,
            fullName: this.fullName,
            username: this.username,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

userSchema.methods.generateRefreshToken = async function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

userSchema.methods.verifyEmailCode = async function (verificationCode) {
    try {
        // Find the verification code document
        const verificationDoc = await mongoose
            .model("VerificationCode")
            .findOne({
                email: this.email,
                code: verificationCode,
                isVerified: false,
            });

        // If no verification code found or it's expired
        if (!verificationDoc) {
            throw new Error("Invalid or expired verification code");
        }

        // Mark verification code as used
        verificationDoc.isVerified = true;
        await verificationDoc.save();

        // Update user's email verification status
        this.isEmailVerified = true;
        await this.save();

        return true;
    } catch (error) {
        throw error;
    }
};

const User = mongoose.model("User", userSchema);

export default User;
