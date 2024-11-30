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
                    color: #4CAF50;
                    letter-spacing: 5px;
                    padding: 15px;
                    background-color: #f8f8f8;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .message {
                    color: #666;
                    line-height: 1.6;
                    margin-bottom: 30px;
                }
                .footer {
                    text-align: center;
                    padding-top: 20px;
                    border-top: 2px solid #f0f0f0;
                    color: #999;
                    font-size: 12px;
                }
                .warning {
                    color: #ff6b6b;
                    font-size: 12px;
                    margin-top: 15px;
                }
                .logo {
                    width: 150px;
                    height: auto;
                    margin-bottom: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="email-wrapper">
                    <div class="header">
                        <h1>Email Verification</h1>
                    </div>
                    <div class="content">
                        <p class="message">
                            Thank you for registering with our File Sharing App! To complete your registration, 
                            please use the verification code below:
                        </p>
                        <div class="verification-code">
                            ${code}
                        </div>
                        <p class="message">
                            This code will expire in <strong>10 minutes</strong>.
                        </p>
                        <p class="warning">
                            If you didn't request this verification code, please ignore this email.
                        </p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} File Sharing App. All rights reserved.</p>
                        <p>This is an automated email, please do not reply.</p>
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
                        <p>© ${new Date().getFullYear()} File Sharing App. All rights reserved.</p>
                        <p>This is an automated email, please do not reply.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
};
