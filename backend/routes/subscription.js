const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/UserEnhanced');
const router = express.Router();

// Plan details (single source of truth)
const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    maxSkills: 2,
    maxMatchesPerMonth: 3,
    features: ['2 skills listing', '3 matches/month', 'Basic messaging']
  },
  pro: {
    name: 'Pro',
    price: 149,
    maxSkills: 10,
    maxMatchesPerMonth: 15,
    features: ['10 skills listing', '15 matches/month', 'Unlimited messaging', 'Verified badge', 'Certificate generation', 'Video sessions']
  },
  premium: {
    name: 'Premium',
    price: 499,
    maxSkills: 999,
    maxMatchesPerMonth: 999,
    features: ['Unlimited skills', 'Unlimited matches', 'Unlimited messaging', 'Verified badge', 'Certificate generation', 'Video sessions', 'Priority in search', 'See who liked you']
  }
};

// GET /api/subscription/plans — public, returns all plan info
router.get('/plans', (req, res) => {
  res.json({ plans: PLANS });
});

// GET /api/subscription/my-plan — returns current user's plan
router.get('/my-plan', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('subscription name email');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const plan = user.subscription?.plan || 'free';
    const expiresAt = user.subscription?.expiresAt || null;
    const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
    const activePlan = isExpired ? 'free' : plan;

    res.json({
      currentPlan: activePlan,
      expiresAt,
      isActive: user.subscription?.isActive || false,
      planDetails: PLANS[activePlan]
    });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/subscription/upgrade — upgrade user plan
// For now this is manual (no real payment) — admin or self-upgrade for beta
router.post('/upgrade', auth, async (req, res) => {
  try {
    const { plan } = req.body;

    if (!['free', 'pro', 'premium'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan. Choose free, pro, or premium.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Set expiry to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    user.subscription = {
      plan,
      startedAt: new Date(),
      expiresAt: plan === 'free' ? null : expiresAt,
      isActive: plan !== 'free'
    };

    await user.save();

    res.json({
      message: `Successfully upgraded to ${PLANS[plan].name} plan!`,
      subscription: user.subscription,
      planDetails: PLANS[plan]
    });
  } catch (error) {
    console.error('Upgrade error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/subscription/cancel — downgrade back to free
router.post('/cancel', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.subscription = {
      plan: 'free',
      startedAt: null,
      expiresAt: null,
      isActive: false
    };

    await user.save();
    res.json({ message: 'Subscription cancelled. You are now on the Free plan.' });
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

