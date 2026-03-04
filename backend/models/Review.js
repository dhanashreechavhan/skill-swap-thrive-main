const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewer:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewee:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null },
  rating:       { type: Number, required: true, min: 1, max: 5 },
  title:        { type: String, trim: true, maxlength: 100, default: '' },
  comment:      { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
  skillTaught:  { type: String, trim: true, default: '' },
  tags:         { type: [String], enum: ['patient','knowledgeable','clear','punctual','friendly','engaging','prepared'], default: [] },
  isPublic:     { type: Boolean, default: true },
  helpfulVotes: { type: Number, default: 0 },
  reported:     { type: Boolean, default: false },
}, { timestamps: true });

reviewSchema.index({ reviewer: 1, reviewee: 1, sessionId: 1 }, { unique: true, sparse: true });

reviewSchema.statics.getAverageRating = async function (userId) {
  const result = await this.aggregate([
    { $match: { reviewee: new mongoose.Types.ObjectId(userId), isPublic: true } },
    { $group: { _id: '$reviewee', avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 }, ratingDistribution: { $push: '$rating' } } },
  ]);
  return result[0] || { avgRating: 0, totalReviews: 0, ratingDistribution: [] };
};

module.exports = mongoose.model('Review', reviewSchema);
