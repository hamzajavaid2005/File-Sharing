import nodemailer from "nodemailer";
import { ApiError } from "./ApiError.js";
import VerificationCode from "../models/verificationCode.model.js";
import { getVerificationEmailTemplate, getWelcomeEmailTemplate } from "./emailTemplates.js";

// Create nodemailer transporter
const createTransporter = () => {
    try {
        // Create transporter with simple authentication
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD.replace(/\s+/g, '') // Remove any spaces
            },
            debug: true, // Enable debug logs
            logger: true // Enable logger
        });

        return transporter;
    } catch (error) {
        console.error("Error creating transporter:", error);
        throw error;
    }
};

let transporter = null;

// Initialize transporter
const initializeTransporter = async () => {
    try {
        if (!transporter) {
            transporter = createTransporter();
            // Test the connection
            await new Promise((resolve, reject) => {
                transporter.verify((error, success) => {
                    if (error) {
                        console.error("Transporter verification failed:", error);
                        reject(error);
                    } else {
                        console.log("Server is ready to send emails");
                        resolve(success);
                    }
                });
            });
        }
        return transporter;
    } catch (error) {
        console.error("Failed to initialize email transporter:", error);
        throw new Error(`Email service initialization failed: ${error.message}`);
    }
};

const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendVerificationEmail = async (email) => {
    try {
        // Ensure transporter is initialized
        if (!transporter) {
            await initializeTransporter();
        }

        const code = generateVerificationCode();

        // Save verification code
        await VerificationCode.findOneAndUpdate(
            { email },
            {
                code,
                isVerified: false,
                createdAt: new Date()
            },
            { upsert: true }
        );

        // Configure email options with new template
        const mailOptions = {
            from: {
                name: "File Sharing App",
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: "Verify Your Email - File Sharing App",
            html: getVerificationEmailTemplate(code)
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.response);
        return true;
    } catch (error) {
        console.error("Email sending error:", error);
        throw new ApiError(500, `Error sending verification email: ${error.message}`);
    }
};

export const sendWelcomeEmail = async (email, username) => {
    try {
        // Ensure transporter is initialized
        if (!transporter) {
            await initializeTransporter();
        }

        // Configure email options with welcome template
        const mailOptions = {
            from: {
                name: "File Sharing App",
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: "Welcome to File Sharing App!",
            html: getWelcomeEmailTemplate(username)
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log("Welcome email sent successfully:", info.response);
        return true;
    } catch (error) {
        console.error("Welcome email sending error:", error);
        throw new ApiError(500, `Error sending welcome email: ${error.message}`);
    }
};

export const verifyCode = async (email, code) => {
    const verificationRecord = await VerificationCode.findOne({
        email,
        code,
        isVerified: false,
    });

    if (!verificationRecord) {
        return false;
    }

    // Mark code as verified
    verificationRecord.isVerified = true;
    await verificationRecord.save();

    return true;
};
