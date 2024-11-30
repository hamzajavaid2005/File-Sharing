export const getVerificationEmailTemplate = (code) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .email-wrapper {
                    background-color: #ffffff;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #f0f0f0;
                }
                .header h1 {
                    color: #333;
                    margin: 0;
                    font-size: 24px;
                }
                .content {
                    padding: 30px 0;
                    text-align: center;
                }
                .verification-code {
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    color: #4F46E5;
                    background-color: #f8f8f8;
                    padding: 15px 25px;
                    border-radius: 8px;
                    margin: 20px 0;
                    display: inline-block;
                }
                .footer {
                    text-align: center;
                    padding-top: 20px;
                    border-top: 2px solid #f0f0f0;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="email-wrapper">
                    <div class="header">
                        <h1>Verify Your Email</h1>
                    </div>
                    <div class="content">
                        <p>Thank you for registering! Please use the verification code below to verify your email address:</p>
                        
                        <div class="verification-code">${code}</div>
                        
                        <p style="margin-top: 30px; color: #666;">
                            This code will expire in 10 minutes.
                        </p>
                        
                        <p style="margin-top: 20px; font-size: 12px; color: #999;">
                            If you didn't request this code, you can safely ignore this email.
                        </p>
                    </div>
                    <div class="footer">
                        <p> ${new Date().getFullYear()} File Share. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
};

export const getWelcomeEmailTemplate = (username) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to File Sharing App</title>
            <style>
                /* Same styles as above */
                body {
                    margin: 0;
                    padding: 0;
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .email-wrapper {
                    background-color: #ffffff;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #f0f0f0;
                }
                .content {
                    padding: 30px 0;
                    text-align: center;
                }
                .message {
                    color: #666;
                    line-height: 1.6;
                    margin-bottom: 20px;
                }
                .button {
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #4CAF50;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    padding-top: 20px;
                    border-top: 2px solid #f0f0f0;
                    color: #999;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="email-wrapper">
                    <div class="header">
                        <img src="https://your-logo-url.com/logo.png" alt="File Sharing App" class="logo">
                        <h1>Welcome to File Sharing App!</h1>
                    </div>
                    <div class="content">
                        <p class="message">
                            Hi ${username},
                        </p>
                        <p class="message">
                            Welcome to File Sharing App! We're excited to have you on board. 
                            Your account has been successfully created and verified.
                        </p>
                        <p class="message">
                            With our app, you can:
                        </p>
                        <ul style="text-align: left; color: #666;">
                            <li>Share files securely</li>
                            <li>Manage your uploads easily</li>
                            <li>Control access to your shared files</li>
                            <li>Track file downloads</li>
                        </ul>
                        <a href="https://your-app-url.com/dashboard" class="button">
                            Go to Dashboard
                        </a>
                    </div>
                    <div class="footer">
                        <p> ${new Date().getFullYear()} File Sharing App. All rights reserved.</p>
                        <p>This is an automated email, please do not reply.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
};
