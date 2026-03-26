const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    bio: {
      type: String,
      maxlength: 1000,
      trim: true
    },
    location: {
      type: String,
      maxlength: 200,
      trim: true
    },
    avatar: String,
    website: {
      type: String,
      maxlength: 500
    },
    socialLinks: {
      linkedin: String,
      twitter: String,
      github: String
    },
    languages: [{
      language: String,
      proficiency: {
        type: String,
        enum: ['Basic', 'Conversational', 'Fluent', 'Native']
      }
    }],
    timezone: {
      type: String,
      default: 'UTC'
    },
    availability: {
      type: String,
      enum: ['Weekdays', 'Weekends', 'Flexible'],
      default: 'Flexible'
    },
    preferences: {
      remoteOnly: { type: Boolean, default: false },
      inPersonOnly: { type: Boolean, default: false },
      maxDistance: { type: Number, default: 50 }, // km
      preferredMeetingTime: [{
        day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
        startTime: String, // HH:MM format
        endTime: String    // HH:MM format
      }]
    },
    isBanned: {
      type: Boolean,
      default: false
    },
    profileCompletion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    verificationStatus: {
      email: { type: Boolean, default: false },
      phone: { type: Boolean, default: false },
      identity: { type: Boolean, default: false }
    }
  },
  skillsTeaching: [{
    skill: String,
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
    },
    experience: Number, // years
    certifications: [String],
    hourlyRate: {
      amount: Number,
      currency: { type: String, default: 'USD' }
    },
    isActive: { type: Boolean, default: true }
  }],
  skillsLearning: [{
    skill: String,
    currentLevel: {
      type: String,
      enum: ['Absolute Beginner', 'Beginner', 'Intermediate', 'Advanced']
    },
    targetLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
    },
    urgency: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    budget: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'USD' }
    },
    deadline: Date
  }],
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    breakdown: {
      teaching: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      punctuality: { type: Number, default: 0 },
      knowledge: { type: Number, default: 0 }
    }
  },
  statistics: {
    lessonsGiven: { type: Number, default: 0 },
    lessonsTaken: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    responseTime: { type: Number, default: 24 }, // hours
    completionRate: { type: Number, default: 0 } // percentage
  },
  notifications: {
    email: {
      newMessages: { type: Boolean, default: true },
      bookingUpdates: { type: Boolean, default: true },
      skillMatches: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false }
    },
    push: {
      newMessages: { type: Boolean, default: true },
      bookingUpdates: { type: Boolean, default: true },
      skillMatches: { type: Boolean, default: false }
    }
  },
  subscription: {
  plan: {
    type: String,
    enum: ['free', 'pro', 'premium'],
    default: 'free'
  },
  startedAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: false
  }
},
  isAdmin: {
    type: Boolean,
    default: false
  },
  // Email verification fields
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Password reset fields
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Login attempt tracking
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  lastLogin: Date,
  
  lastActive: {
    type: Date,
    default: Date.now
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
   // ── OTP Verification fields ──────────────────────────────────────────────
  isVerified:     { type: Boolean, default: false },
  emailVerified:  { type: Boolean, default: false },
  phoneVerified:  { type: Boolean, default: false },
  phone:          { type: String,  default: null },
  emailOTP:       { type: String,  default: null },
  emailOTPExpiry: { type: Date,    default: null },
  phoneOTP:       { type: String,  default: null },
  phoneOTPExpiry: { type: Date,    default: null },
  pendingEmail:   { type: String,  default: null }
}, {
  timestamps: true
});


// Indexes for efficient querying (email index is automatic due to unique: true)
// userSchema.index({ email: 1 }); // Removed - duplicate of unique: true
userSchema.index({ 'skillsTeaching.skill': 1 });
userSchema.index({ 'skillsLearning.skill': 1 });
userSchema.index({ 'profile.location': 1 });
userSchema.index({ 'ratings.average': -1 });
userSchema.index({ lastActive: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Calculate profile completion
userSchema.pre('save', function(next) {
  let completion = 0;
  
  // Basic info (30%)
  if (this.name && this.email) completion += 20;
  if (this.profile?.bio) completion += 10;
  
  // Profile details (30%)
  if (this.profile?.avatar) completion += 10;
  if (this.profile?.location) completion += 10;
  if (this.profile?.languages?.length > 0) completion += 10;
  
  // Skills (40%)
  if (this.skillsTeaching?.length > 0) completion += 20;
  if (this.skillsLearning?.length > 0) completion += 20;
  
  this.profile.profileCompletion = Math.min(completion, 100);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get user's public profile
userSchema.methods.getPublicProfile = function() {
  const user = this.toObject();
  delete user.password;
  delete user.email;
  delete user.notifications;
  return user;
};

// Update last active
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save({ timestamps: false });
};

// Calculate match score with another user
userSchema.methods.calculateMatchScore = function(otherUser) {
  let score = 0;
  let factors = 0;
  
  // Skill overlap - handle both old string format and new object format
  const myTeaching = this.skillsTeaching.map(s => {
    if (typeof s === 'string') return s.toLowerCase();
    if (typeof s === 'object' && s.skill) return s.skill.toLowerCase();
    return '';
  }).filter(s => s.length > 0);
  
  const theirLearning = otherUser.skillsLearning.map(s => {
    if (typeof s === 'string') return s.toLowerCase();
    if (typeof s === 'object' && s.skill) return s.skill.toLowerCase();
    return '';
  }).filter(s => s.length > 0);
  
  const skillOverlap = myTeaching.filter(skill => theirLearning.includes(skill)).length;
  if (skillOverlap > 0) {
    score += skillOverlap * 30; // 30 points per matching skill
    factors++;
  }
  
  // Also check reverse direction - what they teach that I want to learn
  const theirTeaching = otherUser.skillsTeaching.map(s => {
    if (typeof s === 'string') return s.toLowerCase();
    if (typeof s === 'object' && s.skill) return s.skill.toLowerCase();
    return '';
  }).filter(s => s.length > 0);
  
  const myLearning = this.skillsLearning.map(s => {
    if (typeof s === 'string') return s.toLowerCase();
    if (typeof s === 'object' && s.skill) return s.skill.toLowerCase();
    return '';
  }).filter(s => s.length > 0);
  
  const reverseSkillOverlap = theirTeaching.filter(skill => myLearning.includes(skill)).length;
  if (reverseSkillOverlap > 0) {
    score += reverseSkillOverlap * 30; // 30 points per matching skill
    factors++;
  }
  
  // Location proximity (if both have locations)
  if (this.profile?.location && otherUser.profile?.location) {
    // Simple same-location check (could be enhanced with geocoding)
    if (this.profile.location.toLowerCase() === otherUser.profile.location.toLowerCase()) {
      score += 20;
    }
    factors++;
  }
  
  // Rating compatibility
  if (this.ratings.average > 0) {
    score += this.ratings.average * 5; // 5 points per star
    factors++;
  }
  
  // Response time factor
  if (this.statistics.responseTime <= 24) {
    score += 10; // Bonus for quick response
  }
  
  // Normalize score
  return factors > 0 ? Math.min(score / factors, 100) : 0;
};

// Authentication methods
// Check if account is locked
userSchema.methods.isLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now();
};

// Increment login attempts
userSchema.methods.incrementLoginAttempts = function() {
  const maxLoginAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
  const lockTime = parseInt(process.env.ACCOUNT_LOCK_TIME) || 2 * 60 * 60 * 1000; // 2 hours
  
  this.loginAttempts += 1;
  
  if (this.loginAttempts >= maxLoginAttempts && !this.isLocked()) {
    this.lockUntil = Date.now() + lockTime;
  }
  
  return this.save();
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  if (this.loginAttempts > 0 || this.lockUntil) {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    return this.save();
  }
  return Promise.resolve();
};

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);