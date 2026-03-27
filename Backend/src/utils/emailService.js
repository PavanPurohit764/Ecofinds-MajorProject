const nodemailer = require("nodemailer");

// Create transporter for email service
const createTransporter = () => {
  const user = (process.env.EMAIL_USER || "").trim();
  const pass = (process.env.EMAIL_PASS || "").trim();

  const config = {
    service: "gmail",
    // host: "smtp.gmail.com",
    // port: 465,
    // secure: true,
    auth: {
      user: user,
      pass: pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    // Adding shorter timeouts to fail fast and debug
    connectionTimeout: 15000, // 15s
    greetingTimeout: 15000,    // 15s
    socketTimeout: 30000,      // 30s
  };

  console.log(`[EMAIL] Creating transporter with Gmail service. Auth user: ${user}`);
  const transporter = nodemailer.createTransport(config);
  return transporter;
};

/**
 * Send OTP email for signup verification
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {string} username - User's username
 * @returns {Promise} Email send result
 */
const sendSignupOTP = async (email, otp, username = "User") => {
  try {
    console.log("Starting email send process...");
    console.log("Email config:", {
      service: "gmail",
      user: process.env.EMAIL_USER,
      passLength: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0,
    });

    const transporter = createTransporter();

    console.log("[EMAIL] Transporter created. Verifying connection...");
    await transporter.verify();
    console.log("[EMAIL] Transporter verified successfully");

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification - Complete Your Registration",
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome!</h1>
                        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Complete your registration</p>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-top: 0;">Hi ${username}! 👋</h2>
                        <p style="color: #666; line-height: 1.6; font-size: 16px;">
                            Thank you for signing up! To complete your registration and verify your email address, 
                            please use the following verification code:
                        </p>
                        
                        <div style="background: #f8f9fa; border: 2px dashed #667eea; border-radius: 10px; padding: 25px; text-align: center; margin: 25px 0;">
                            <h1 style="color: #667eea; font-size: 42px; margin: 0; letter-spacing: 8px; font-weight: bold; font-family: 'Courier New', monospace;">
                                ${otp}
                            </h1>
                            <p style="color: #999; margin: 15px 0 0 0; font-size: 14px;">⏰ This code expires in 5 minutes</p>
                        </div>
                        
                        <p style="color: #666; line-height: 1.6; font-size: 16px;">
                            Enter this code in the verification field to activate your account.
                        </p>
                        
                        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                            <p style="margin: 0; color: #856404; font-size: 14px;">
                                <strong>🔒 Security Note:</strong> If you didn't request this verification, please ignore this email. 
                                Never share this code with anyone.
                            </p>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                        <p>© 2025 Your Platform. All rights reserved.</p>
                    </div>
                </div>
            `,
    };

    console.log("Mail options prepared, attempting to send...");
    console.log("Sending to:", email);

    const result = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Signup OTP email sent successfully. ID: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error("Email send error details:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Send OTP email for signin verification
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {string} username - User's username
 * @returns {Promise} Email send result
 */
const sendSigninOTPEmail = async (email, otp, username = "User") => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Sign In Verification Code",
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                    <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; border-radius: 10px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">Sign In Request</h1>
                        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">🔐 Secure access verification</p>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-top: 0;">Hello ${username}!</h2>
                        <p style="color: #666; line-height: 1.6; font-size: 16px;">
                            Someone is trying to sign in to your account. If this was you, use the verification code below:
                        </p>
                        
                        <div style="background: #f8f9fa; border: 2px dashed #4facfe; border-radius: 10px; padding: 25px; text-align: center; margin: 25px 0;">
                            <h1 style="color: #4facfe; font-size: 42px; margin: 0; letter-spacing: 8px; font-weight: bold; font-family: 'Courier New', monospace;">
                                ${otp}
                            </h1>
                            <p style="color: #999; margin: 15px 0 0 0; font-size: 14px;">⏰ This code expires in 5 minutes</p>
                        </div>
                        
                        <p style="color: #666; line-height: 1.6; font-size: 16px;">
                            Enter this code on the sign-in page to access your account securely.
                        </p>
                        
                        <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 5px;">
                            <p style="margin: 0; color: #721c24; font-size: 14px;">
                                <strong>⚠️ Important:</strong> If you didn't try to sign in, someone may be trying to access your account. 
                                Please secure your account immediately.
                            </p>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                        <p>© 2025 Your Platform. All rights reserved.</p>
                    </div>
                </div>
            `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Signin OTP email sent successfully:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending signin OTP email:", error);
    throw error;
  }
};

module.exports = {
  sendSignupOTP,
  sendSigninOTPEmail,
};
