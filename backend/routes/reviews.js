const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Review = require('../models/Review');
const { auth } = require('../middleware/auth'); // your existing JWT middleware

// GET /api/reviews/user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ message: 'Invalid user ID' });
    const sortMap = { newest:{createdAt:-1}, oldest:{createdAt:1}, highest:{rating:-1}, lowest:{rating:1}, helpful:{helpfulVotes:-1} };
    const reviews = await Review.find({ reviewee: userId, isPublic: true, reported: false })
      .populate('reviewer', 'name avatar profilePhoto')
      .sort(sortMap[sort] || sortMap.newest)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    const total = await Review.countDocuments({ reviewee: userId, isPublic: true });
    const stats = await Review.getAverageRating(userId);
    const distribution = { 1:0, 2:0, 3:0, 4:0, 5:0 };
    (stats.ratingDistribution||[]).forEach(r => { distribution[r] = (distribution[r]||0)+1; });
    res.json({ reviews, pagination: { total, page: parseInt(page), pages: Math.ceil(total/parseInt(limit)) }, stats: { averageRating: Math.round((stats.avgRating||0)*10)/10, totalReviews: stats.totalReviews||0, distribution } });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/reviews
router.post('/', auth, async (req, res) => {
  try {
    const { revieweeId, rating, title, comment, skillTaught, tags, isPublic, sessionId } = req.body;
    const reviewerId = req.user.id;
    if (reviewerId === revieweeId) return res.status(400).json({ message: 'Cannot review yourself' });
    const existing = await Review.findOne({ reviewer: reviewerId, reviewee: revieweeId });
    if (existing) return res.status(409).json({ message: 'You have already reviewed this user' });
    const review = new Review({ reviewer: reviewerId, reviewee: revieweeId, rating, title: title||'', comment, skillTaught: skillTaught||'', tags: tags||[], isPublic: isPublic!==undefined?isPublic:true, sessionId: sessionId||null });
    await review.save();
    await review.populate('reviewer', 'name avatar profilePhoto');
    res.status(201).json({ message: 'Review submitted!', review });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Duplicate review' });
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/reviews/:reviewId
router.put('/:reviewId', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Not found' });
    if (review.reviewer.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });
    ['rating','title','comment','skillTaught','tags','isPublic'].forEach(f => { if (req.body[f]!==undefined) review[f]=req.body[f]; });
    await review.save();
    await review.populate('reviewer', 'name avatar profilePhoto');
    res.json({ message: 'Review updated', review });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/reviews/:reviewId
router.delete('/:reviewId', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Not found' });
    if (review.reviewer.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });
    await review.deleteOne();
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/reviews/:reviewId/helpful
router.post('/:reviewId/helpful', auth, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.reviewId, { $inc: { helpfulVotes: 1 } }, { new: true });
    if (!review) return res.status(404).json({ message: 'Not found' });
    res.json({ helpfulVotes: review.helpfulVotes });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/reviews/:reviewId/report
router.post('/:reviewId/report', auth, async (req, res) => {
  try {
    await Review.findByIdAndUpdate(req.params.reviewId, { reported: true });
    res.json({ message: 'Reported successfully' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
