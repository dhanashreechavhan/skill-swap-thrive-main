const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  }, 
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Technology', 'Language', 'Art', 'Music', 'Sports', 'Cooking', 'Other']
  },
  offeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Beginner'
  },
  yearsExperience: {
    type: Number,
    min: 0,
    max: 50,
    default: 0
  },
  availability: {
    type: String,
    enum: ['Available', 'Unavailable'],
    default: 'Available'
  },
  availabilityDescription: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // ── Course Content ──
  courseContent: {
    courseType: { type: String, enum: ['Technical', 'Non-Technical'], default: 'Technical' },
    whatYouWillLearn: { type: String, trim: true, maxlength: 1000 },
    topics: [{ type: String, trim: true }],
    duration: { type: String, trim: true },
    sessionsPerWeek: { type: Number, min: 1, max: 7, default: 2 },
    sessionDurationMinutes: { type: Number, default: 60 },
    prerequisites: { type: String, trim: true },
    isFree: { type: Boolean, default: true },
    pricePerSession: { type: Number, default: 0 },
  },
  portfolio: [{
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number
  }],
  tags: [String]
}, {
  timestamps: true
});

module.exports = mongoose.models.Skill || mongoose.model('Skill', skillSchema);
