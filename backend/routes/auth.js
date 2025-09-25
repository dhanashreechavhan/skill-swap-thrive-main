const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/UserEnhanced');
const { authValidation } = require('../middleware/validation');
// Email service disabled for now
// const { sendEmail, emailTemplates } = require('../utils/emailService');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Register
router.post('/register', ...authValidation.register(), async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ 
                message: 'An account with this email address already exists. Please use a different email or try logging in instead.',
                field: 'email'
            });
        }

        // Create user with email verification disabled
        const user = new User({
            name,
            email,
            password,
            isEmailVerified: true // Email verification disabled
        });
        await user.save();

        console.log('✅ User registered successfully without email verification');

        // Create JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'Registration successful. You can now log in.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isEmailVerified: user.isEmailVerified
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            message: 'We encountered an issue while creating your account. Please try again in a few moments.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Verify Email (Email disabled - auto-verify)
router.get('/verify-email/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ 
                message: 'This verification link is invalid or has expired. Please request a new verification email.',
                field: 'token'
            });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ 
            message: 'We encountered an issue while processing your request. Please try again or contact support.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Login
router.post('/login', ...authValidation.login(), async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ 
                message: 'No account found with this email address. Please check your email or create a new account.',
                field: 'email'
            });
        }

        // Check if account is locked
        if (user.isLocked()) {
            const lockoutTime = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60)); // minutes remaining
            return res.status(423).json({
                message: `Your account is temporarily locked due to multiple failed login attempts. Please try again in ${lockoutTime > 0 ? lockoutTime + ' minutes' : 'a few minutes'}.`,
                field: 'account'
            });
        }

        // Check if user is banned
        if (user.profile?.isBanned) {
            return res.status(403).json({ 
                message: 'Your account has been suspended. If you believe this is an error, please contact our support team for assistance.',
                field: 'account'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            await user.incrementLoginAttempts();
            const attemptsLeft = Math.max(0, 5 - (user.loginAttempts || 0));
            return res.status(401).json({ 
                message: attemptsLeft > 1 
                    ? `Incorrect password. You have ${attemptsLeft} attempts remaining before your account is temporarily locked.`
                    : 'Incorrect password. Your account will be temporarily locked after one more failed attempt.',
                field: 'password'
            });
        }

        // Reset login attempts on successful login
        await user.resetLoginAttempts();

        // Update last login
        user.lastLogin = Date.now();
        await user.save();

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isEmailVerified: user.isEmailVerified,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'We encountered an issue while processing your request. Please try again or contact support.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Request Password Reset (Email disabled)
router.post('/forgot-password', ...authValidation.email(), async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({ message: 'Password reset feature is currently disabled. Please contact support.' });
        }

        // Email service is disabled - return message
        res.json({ message: 'Password reset feature is currently disabled. Please contact support.' });
    } catch (error) {
        res.status(500).json({ 
            message: 'We encountered an issue while processing your request. Please try again or contact support.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Reset Password (Email disabled)
router.post('/reset-password/:token', ...authValidation.resetPassword(), async (req, res) => {
    try {
        res.status(400).json({ message: 'Password reset feature is currently disabled. Please contact support.' });
    } catch (error) {
        res.status(500).json({ 
            message: 'We encountered an issue while processing your request. Please try again or contact support.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Change Password (Authenticated)
router.post('/change-password', auth, ...authValidation.changePassword(), async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.userId);

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ 
                message: 'The current password you entered is incorrect. Please try again.',
                field: 'currentPassword'
            });
        }

        user.password = newPassword;
        await user.save();

        console.log('✅ Password changed successfully for user:', user.email);
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ 
            message: 'We encountered an issue while processing your request. Please try again or contact support.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Resend Verification Email (Email disabled)
router.post('/resend-verification', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (user.isEmailVerified) {
            return res.status(400).json({ 
                message: 'Your email address is already verified. No further action is needed.',
                field: 'email'
            });
        }

        // Automatically verify email since email service is disabled
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.json({ message: 'Email verification bypassed - account is now verified' });
    } catch (error) {
        res.status(500).json({ 
            message: 'We encountered an issue while processing your request. Please try again or contact support.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
