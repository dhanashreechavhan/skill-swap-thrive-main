const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends an OTP email to the user
 * @param {string} toEmail - recipient email address
 * @param {string} otp - 6 digit OTP code
 */
const sendOTPEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: `"SwapLearnThrive" <${process.env.FROM_EMAIL}>`,
    to: toEmail,
    subject: `${otp} is your SwapLearnThrive verification code`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f5ff; border-radius: 16px;">
        
        <!-- Logo / Header -->
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #6d28d9; margin: 0;">🔄 SwapLearnThrive</h2>
          <p style="color: #7c3aed; font-size: 13px; margin: 4px 0 0;">Learn · Teach · Grow</p>
        </div>

        <!-- Card -->
        <div style="background: white; border-radius: 12px; padding: 28px; box-shadow: 0 2px 12px rgba(109,40,217,0.08);">
          <h3 style="color: #1e1b4b; margin: 0 0 8px;">Verify your email address</h3>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 24px;">
            Use the code below to verify your email. This code expires in <strong>10 minutes</strong>.
          </p>

          <!-- OTP Box -->
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0 0 8px; letter-spacing: 2px; text-transform: uppercase;">Your verification code</p>
            <p style="color: white; font-size: 38px; font-weight: 900; letter-spacing: 10px; margin: 0;">${otp}</p>
          </div>

          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            ⚠️ Never share this code with anyone. SwapLearnThrive will never ask for your OTP.
          </p>
        </div>

        <!-- Footer -->
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 20px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };
