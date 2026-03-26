const express = require('express');
const router = express.Router();
const User = require('../models/UserEnhanced');
const { auth } = require('../middleware/auth');
const { sendOTPEmail } = require('../utils/sendEmail');
const { sendOTPSMS } = require('../utils/sendSMS');

// ─── Helper: Generate 6-digit OTP ────────────────────────────────────────────
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─── Helper: OTP Expiry (10 minutes from now) ─────────────────────────────────
const getOTPExpiry = () => {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/verification/send-otp
// Sends OTP to either email or phone (user's choice)
// Body: { method: "email" | "phone", value: "user@gmail.com" | "9876543210" }
// ══════════════════════════════════════════════════════════════════════════════
router.post('/send-otp', auth, async (req, res) => {
  try {
    const { method, value } = req.body;

    // ── Validate input ───────────────────────────────────────────────────────
    if (!method || !value) {
      return res.status(400).json({ message: 'Method and value are required' });
    }
    if (!['email', 'phone'].includes(method)) {
      return res.status(400).json({ message: 'Method must be "email" or "phone"' });
    }

    const userId = req.user._id;
    const otp = generateOTP();
    const expiry = getOTPExpiry();

    if (method === 'email') {
      // ── Check email is not already used by another VERIFIED account ─────────
      const existingVerified = await User.findOne({
        email: value.toLowerCase().trim(),
        emailVerified: true,
        _id: { $ne: userId },  // not the current user
      });
      if (existingVerified) {
        return res.status(400).json({
          message: 'This email is already verified on another account.',
        });
      }

      // Save OTP to user document
      await User.findByIdAndUpdate(userId, {
        emailOTP: otp,
        emailOTPExpiry: expiry,
        pendingEmail: value.toLowerCase().trim(), // save what we're verifying
      });

      // Send the email
      await sendOTPEmail(value.trim(), otp);
      console.log(`📧 Email OTP sent to ${value} for user ${userId}`);

      return res.json({ message: `OTP sent to ${value}` });

    } else if (method === 'phone') {
      // ── Clean phone number ───────────────────────────────────────────────────
      const cleanPhone = value.replace(/^(\+91|91)/, '').trim();

      // ── Validate 10-digit Indian number ─────────────────────────────────────
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        return res.status(400).json({
          message: 'Please enter a valid 10-digit Indian mobile number.',
        });
      }

      // ── Check phone is not already used by another VERIFIED account ─────────
      const existingVerified = await User.findOne({
        phone: cleanPhone,
        phoneVerified: true,
        _id: { $ne: userId },
      });
      if (existingVerified) {
        return res.status(400).json({
          message: 'This phone number is already verified on another account.',
        });
      }

      // Save OTP to user document
      await User.findByIdAndUpdate(userId, {
        phoneOTP: otp,
        phoneOTPExpiry: expiry,
        phone: cleanPhone,
      });

      // Send the SMS
      await sendOTPSMS(cleanPhone, otp);
      console.log(`📱 Phone OTP sent to ${cleanPhone} for user ${userId}`);

      return res.json({ message: `OTP sent to ${cleanPhone}` });
    }

  } catch (err) {
    console.error('Error in send-otp:', err);

    // Give a helpful message if email sending fails
    if (err.message?.includes('Invalid login') || err.message?.includes('SMTP')) {
      return res.status(500).json({
        message: 'Email service error. Please check SMTP configuration.',
      });
    }

    return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/verification/verify-otp
// Verifies the OTP entered by the user
// Body: { method: "email" | "phone", otp: "123456" }
// ══════════════════════════════════════════════════════════════════════════════
router.post('/verify-otp', auth, async (req, res) => {
  try {
    const { method, otp } = req.body;

    if (!method || !otp) {
      return res.status(400).json({ message: 'Method and OTP are required' });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (method === 'email') {
      // ── Check OTP exists ─────────────────────────────────────────────────────
      if (!user.emailOTP) {
        return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
      }

      // ── Check expiry ─────────────────────────────────────────────────────────
      if (new Date() > new Date(user.emailOTPExpiry)) {
        return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
      }

      // ── Check OTP matches ────────────────────────────────────────────────────
      if (user.emailOTP !== otp.trim()) {
        return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
      }

      // ✅ OTP correct — mark email as verified, clear OTP
      await User.findByIdAndUpdate(userId, {
        emailVerified: true,
        isVerified: true,
        email: user.pendingEmail || user.email,
        emailOTP: null,
        emailOTPExpiry: null,
        pendingEmail: null,
      });

      return res.json({
        message: '✅ Email verified successfully!',
        isVerified: true,
      });

    } else if (method === 'phone') {
      // ── Check OTP exists ─────────────────────────────────────────────────────
      if (!user.phoneOTP) {
        return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
      }

      // ── Check expiry ─────────────────────────────────────────────────────────
      if (new Date() > new Date(user.phoneOTPExpiry)) {
        return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
      }

      // ── Check OTP matches ────────────────────────────────────────────────────
      if (user.phoneOTP !== otp.trim()) {
        return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
      }

      // ✅ OTP correct — mark phone as verified, clear OTP
      await User.findByIdAndUpdate(userId, {
        phoneVerified: true,
        isVerified: true,
        phoneOTP: null,
        phoneOTPExpiry: null,
      });

      return res.json({
        message: '✅ Phone number verified successfully!',
        isVerified: true,
      });
    }

  } catch (err) {
    console.error('Error in verify-otp:', err);
    return res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/verification/status
// Returns the current verification status of the logged-in user
// ══════════════════════════════════════════════════════════════════════════════
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      'emailVerified phoneVerified isVerified email phone'
    );
    return res.json({
      isVerified:    user.isVerified    || false,
      emailVerified: user.emailVerified || false,
      phoneVerified: user.phoneVerified || false,
      email:         user.email,
      phone:         user.phone || null,
    });
  } catch (err) {
    console.error('Error in verification status:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
