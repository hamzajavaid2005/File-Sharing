import mongoose from "mongoose";

const verificationCodeSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600 // Code expires after 10 minutes
    }
});

const VerificationCode = mongoose.model("VerificationCode", verificationCodeSchema);

export default VerificationCode;
