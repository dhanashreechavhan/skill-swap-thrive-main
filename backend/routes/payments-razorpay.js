const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { auth } = require('../middleware/auth');
const User = require('../models/UserEnhanced');
const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Plan prices in paise (1 rupee = 100 paise)
const PLAN_PRICES = {
  pro: 14900,      // ₹149/week
  premium: 49900,  // ₹499
};

const PLAN_NAMES = {
  pro: 'SkillSwap Pro (Weekly)',
  premium: 'SkillSwap Premium (Monthly)',
};

// POST /api/payments/create-order
// Creates a Razorpay order before payment
router.post('/create-order', auth, async (req, res) => {
  try {
    const { plan } = req.body;

    if (!['pro', 'premium'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan. Choose pro or premium.' });
    }

    const amount = PLAN_PRICES[plan];

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`.slice(0, 40),
      notes: {
        userId: req.user._id.toString(),
        
        plan,
      },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan,
      planName: PLAN_NAMES[plan],
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create payment order', error: error.message });
  }
});

// POST /api/payments/verify
// Verifies payment after user pays and upgrades their plan
router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    // Verify signature — this proves payment is genuine
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed! Invalid signature.' });
    }

    // Payment is genuine — upgrade user plan
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const validityDays = plan === 'pro' ? 7 : 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    user.subscription = {
      plan,
      startedAt: new Date(),
      expiresAt,
      isActive: true,
    };

    await user.save();

    console.log(`✅ Payment verified! User ${user.email} upgraded to ${plan}`);

    res.json({
      message: `🎉 Payment successful! You are now on the ${plan} plan!`,
      subscription: user.subscription,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Payment verification failed', error: error.message });
  }
});

// GET /api/payments/key
// Returns public key for frontend
router.get('/key', auth, (req, res) => {
  res.json({ keyId: process.env.RAZORPAY_KEY_ID });
});

module.exports = router;
