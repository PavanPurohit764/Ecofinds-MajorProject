const https = require("https");

/**
 * Send email using Brevo HTTP API (Port 443 - Bypasses SMTP blocks)
 * @param {Object} options - Email options { to, subject, html }
 * @returns {Promise} API response
 */
const sendEmailViaBrevoAPI = (options) => {
  return new Promise((resolve, reject) => {
    const senderEmail = (process.env.EMAIL_USER || "").trim();
    const apiKey = (process.env.EMAIL_PASS || "").trim();

    if (!senderEmail || !apiKey) {
      return reject(new Error("EMAIL_USER or EMAIL_PASS variables are missing"));
    }

    const data = JSON.stringify({
      sender: { email: senderEmail, name: "EcoFinds" },
      to: [{ email: options.to }],
      subject: options.subject,
      htmlContent: options.html,
    });

    const reqOptions = {
      hostname: "api.brevo.com",
      path: "/v3/smtp/email",
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
        "content-length": data.length,
      },
    };

    console.log(`[EMAIL-API] Attempting to send email to ${options.to} via Brevo API...`);
    
    const req = https.request(reqOptions, (res) => {
      let responseData = "";
      res.on("data", (chunk) => {
        responseData += chunk;
      });
      res.on("end", () => {
        console.log(`[EMAIL-API] Status: ${res.statusCode}`);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(responseData);
            console.log(`[EMAIL-API] Success! Message ID: ${parsed.messageId}`);
            resolve(parsed);
          } catch (e) {
            resolve({ success: true, message: "Sent (Parse Error)" });
          }
        } else {
          console.error(`[EMAIL-API] Error response: ${responseData}`);
          reject(new Error(`Brevo API Error: ${res.statusCode} - ${responseData}`));
        }
      });
    });

    req.on("error", (error) => {
      console.error(`[EMAIL-API] Request error: ${error.message}`);
      reject(error);
    });

    // Set a timeout of 20 seconds for the API call
    req.setTimeout(20000, () => {
      req.destroy();
      reject(new Error("Brevo API Connection Timeout (20s)"));
    });

    req.write(data);
    req.end();
  });
};

/**
 * Send OTP email for signup verification
 */
const sendSignupOTP = async (email, otp, username = "User") => {
  const html = `
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
            </div>
        </div>
    `;

  return await sendEmailViaBrevoAPI({
    to: email,
    subject: "Email Verification - Complete Your Registration",
    html: html,
  });
};

/**
 * Send OTP email for signin verification
 */
const sendSigninOTPEmail = async (email, otp, username = "User") => {
  const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; border-radius: 10px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Sign In Request</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px;">
                <h2 style="color: #333; margin-top: 0;">Hello ${username}!</h2>
                <div align="center" style="margin: 20px 0;">
                    <h1 style="font-size: 40px; color: #4facfe;">${otp}</h1>
                </div>
            </div>
        </div>
    `;

  return await sendEmailViaBrevoAPI({
    to: email,
    subject: "Sign In Verification Code",
    html: html,
  });
};

module.exports = {
  sendSignupOTP,
  sendSigninOTPEmail,
};
