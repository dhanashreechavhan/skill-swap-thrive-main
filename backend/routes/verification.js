const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/UserEnhanced');
const { auth } = require('../middleware/auth');
const { sendOTPEmail } = require('../utils/sendEmail');

// ─── Multer setup for document uploads ───────────────────────────────────────
const uploadDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `doc_${req.user._id}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, or PDF files are allowed.'));
  },
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const getOTPExpiry = () => new Date(Date.now() + 10 * 60 * 1000);

// ── POST /api/verification/send-otp ──────────────────────────────────────────
router.post('/send-otp', auth, async (req, res) => {
  try {
    const { method, value } = req.body;
    if (!method || !value) return res.status(400).json({ message: 'Method and value are required' });

    const userId = req.user._id;
    const otp = generateOTP();
    const expiry = getOTPExpiry();

    if (method === 'email') {
      const existing = await User.findOne({ email: value.toLowerCase().trim(), emailVerified: true, _id: { $ne: userId } });
      if (existing) return res.status(400).json({ message: 'This email is already verified on another account.' });
      await User.findByIdAndUpdate(userId, { emailOTP: otp, emailOTPExpiry: expiry, pendingEmail: value.toLowerCase().trim() });
      await sendOTPEmail(value.trim(), otp);
      return res.json({ message: `OTP sent to ${value}` });
    } else {
      const cleanPhone = value.replace(/^(\+91|91)/, '').trim();
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) return res.status(400).json({ message: 'Enter a valid 10-digit Indian number.' });
      const existing = await User.findOne({ phone: cleanPhone, phoneVerified: true, _id: { $ne: userId } });
      if (existing) return res.status(400).json({ message: 'This phone is already verified on another account.' });
      await User.findByIdAndUpdate(userId, { phoneOTP: otp, phoneOTPExpiry: expiry, phone: cleanPhone });
      try {
        const { sendOTPSMS } = require('../utils/sendSMS');
        await sendOTPSMS(cleanPhone, otp);
        return res.json({ message: `OTP sent to +91${cleanPhone}` });
      } catch (smsErr) {
        return res.status(503).json({ message: 'Phone OTP unavailable. Please use email verification instead.' });
      }
    }
  } catch (err) {
    console.error('Error in send-otp:', err);
    if (err.message?.includes('Invalid login') || err.message?.includes('SMTP')) {
      return res.status(500).json({ message: 'Email config error. Check SMTP settings.' });
    }
    return res.status(500).json({ message: 'Failed to send OTP. Try again.' });
  }
});

// ── POST /api/verification/verify-otp ────────────────────────────────────────
router.post('/verify-otp', auth, async (req, res) => {
  try {
    const { method, otp } = req.body;
    if (!method || !otp) return res.status(400).json({ message: 'Method and OTP required' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (method === 'email') {
      if (!user.emailOTP) return res.status(400).json({ message: 'No OTP found. Request a new one.' });
      if (new Date() > new Date(user.emailOTPExpiry)) return res.status(400).json({ message: 'OTP expired. Request a new one.' });
      if (user.emailOTP !== otp.trim()) return res.status(400).json({ message: 'Incorrect OTP. Try again.' });
      await User.findByIdAndUpdate(req.user._id, {
        emailVerified: true, email: user.pendingEmail || user.email,
        emailOTP: null, emailOTPExpiry: null, pendingEmail: null,
      });
      return res.json({ message: '✅ Email verified!', emailVerified: true });
    } else {
      if (!user.phoneOTP) return res.status(400).json({ message: 'No OTP found. Request a new one.' });
      if (new Date() > new Date(user.phoneOTPExpiry)) return res.status(400).json({ message: 'OTP expired.' });
      if (user.phoneOTP !== otp.trim()) return res.status(400).json({ message: 'Incorrect OTP.' });
      await User.findByIdAndUpdate(req.user._id, { phoneVerified: true, phoneOTP: null, phoneOTPExpiry: null });
      return res.json({ message: '✅ Phone verified!', phoneVerified: true });
    }
  } catch (err) {
    console.error('Error in verify-otp:', err);
    return res.status(500).json({ message: 'Verification failed. Try again.' });
  }
});

// ── POST /api/verification/upload-document ────────────────────────────────────
router.post('/upload-document', auth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please upload a document.' });
    const { documentType } = req.body;
    if (!['aadhaar', 'college_id'].includes(documentType)) {
      return res.status(400).json({ message: 'Document type must be aadhaar or college_id.' });
    }
    await User.findByIdAndUpdate(req.user._id, {
      documentType,
      documentPath: `documents/${req.file.filename}`,
      documentStatus: 'pending',
      documentSubmittedAt: new Date(),
      documentRejectionReason: null,
    });
    return res.json({ message: '✅ Document uploaded! We will verify it within 24-48 hours.', documentStatus: 'pending' });
  } catch (err) {
    console.error('Error uploading document:', err);
    return res.status(500).json({ message: err.message || 'Upload failed.' });
  }
});

// ── GET /api/verification/status ─────────────────────────────────────────────
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      'emailVerified phoneVerified isVerified email phone documentType documentStatus documentRejectionReason documentSubmittedAt'
    );
    return res.json({
      isVerified:              user.isVerified    || false,
      emailVerified:           user.emailVerified || false,
      phoneVerified:           user.phoneVerified || false,
      email:                   user.email,
      phone:                   user.phone || null,
      documentType:            user.documentType  || null,
      documentStatus:          user.documentStatus || null,
      documentRejectionReason: user.documentRejectionReason || null,
      documentSubmittedAt:     user.documentSubmittedAt || null,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/verification/admin/pending  (Admin only) ─────────────────────────
router.get('/admin/pending', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });
    const users = await User.find({ documentStatus: 'pending' })
      .select('name email documentType documentPath documentSubmittedAt')
      .sort({ documentSubmittedAt: 1 });
    return res.json({ users, count: users.length });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// ── PUT /api/verification/admin/approve/:userId  (Admin only) ─────────────────
router.put('/admin/approve/:userId', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });
    await User.findByIdAndUpdate(req.params.userId, { documentStatus: 'approved', isVerified: true });
    return res.json({ message: 'User document approved! They are now fully verified.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// ── PUT /api/verification/admin/reject/:userId  (Admin only) ──────────────────
router.put('/admin/reject/:userId', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });
    const { reason } = req.body;
    await User.findByIdAndUpdate(req.params.userId, {
      documentStatus: 'rejected',
      documentRejectionReason: reason || 'Document unclear. Please re-upload a clearer photo.',
      isVerified: false,
    });
    return res.json({ message: 'Document rejected. User will be asked to re-upload.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
