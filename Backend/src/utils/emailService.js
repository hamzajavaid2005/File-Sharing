import nodemailer from "nodemailer";
import { ApiError } from "./ApiError.js";

// Create nodemailer transporter
const createTransporter = () => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
        return transporter;
    } catch (error) {
        console.error("Error creating transporter:", error);
        throw new ApiError(500, "Failed to initialize email service");
    }
};

// Generate a random 6-digit verification code
export const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generic email sending function
export const sendEmail = async (to, subject, htmlContent) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully to:", to);
    } catch (error) {
        console.error("Error sending email:", error);
        throw new ApiError(500, "Failed to send email. Please try again later.");
    }
};

// Send verification email
export const sendVerificationEmail = async (email, code) => {
    try {
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Verify Your Email</h2>
                <p>Your verification code is:</p>
                <h1 style="color: #4F46E5; font-size: 32px; letter-spacing: 5px; text-align: center; padding: 20px; background: #F3F4F6; border-radius: 8px;">${code}</h1>
                <p style="color: #666;">This code will expire in 10 minutes.</p>
                <p style="color: #666;">If you didn't request this code, please ignore this email.</p>
            </div>
        `;
        
        await sendEmail(email, 'Verify Your Email - File Sharing App', htmlContent);
    } catch (error) {
        throw new ApiError(500, "Failed to send verification email. Please try again later.");
    }
};

// Send welcome email
export const sendWelcomeEmail = async (email, username) => {
    try {
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Welcome ${username}!</h2>
                <p>Thank you for joining our File Sharing App. Your account has been successfully verified.</p>
                <p>You can now start sharing files securely with others.</p>
                <div style="margin-top: 20px; padding: 20px; background: #F3F4F6; border-radius: 8px;">
                    <p style="margin: 0; color: #666;">Need help getting started?</p>
                    <p style="margin: 5px 0 0; color: #666;">Check out our documentation or contact our support team.</p>
                </div>
            </div>
        `;
        
        await sendEmail(email, 'Welcome to File Sharing App!', htmlContent);
    } catch (error) {
        console.error("Error sending welcome email:", error);
        // Don't throw error for welcome email as it's not critical
    }
};
