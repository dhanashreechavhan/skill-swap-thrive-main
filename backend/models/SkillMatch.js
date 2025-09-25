const mongoose = require('mongoose');

const skillMatchSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  matchScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  factors: {
    skillCompatibility: Number,
    locationDistance: Number,
    availabilityOverlap: Number,
    ratingScore: Number,
    experienceLevel: Number
  },
  status: {
    type: String,
    enum: ['Active', 'Contacted', 'Scheduled', 'Completed', 'Declined'],
    default: 'Active'
  },
  studentInterested: {
    type: Boolean,
    default: false
  },
  teacherInterested: {
    type: Boolean,
    default: false
  },
  lastContactDate: Date,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true
});

// Index for efficient matching queries
skillMatchSchema.index({ student: 1, matchScore: -1 });
skillMatchSchema.index({ teacher: 1, matchScore: -1 });
skillMatchSchema.index({ skill: 1, matchScore: -1 });
skillMatchSchema.index({ expiresAt: 1 });

// Static method to calculate match score
skillMatchSchema.statics.calculateMatchScore = function(student, teacher, skill) {
  let score = 0;
  const factors = {};

  // Skill compatibility (40% weight)
  const teacherSkills = teacher.skillsTeaching || [];
  const studentNeeds = student.skillsLearning || [];
  
  // Extract skill names from both arrays (handle both string and object formats)
  const teacherSkillNames = teacherSkills.map(s => 
    typeof s === 'string' ? s.toLowerCase() : (s.skill ? s.skill.toLowerCase() : '')
  ).filter(s => s.length > 0);
  
  const studentSkillNames = studentNeeds.map(s => 
    typeof s === 'string' ? s.toLowerCase() : (s.skill ? s.skill.toLowerCase() : '')
  ).filter(s => s.length > 0);
  
  // Check if teacher offers this skill and student wants to learn it
  const teacherOffersSkill = teacherSkillNames.some(name => 
    name === skill.name.toLowerCase()
  );
  const studentWantsSkill = studentSkillNames.some(name => 
    name === skill.name.toLowerCase()
  );
  
  // The algorithm should check if student wants to learn what teacher offers
  // OR if teacher teaches what student wants to learn (bidirectional compatibility)
  if (teacherOffersSkill && studentWantsSkill) {
    factors.skillCompatibility = 100;
    score += 40;
  } else if (teacherOffersSkill || studentWantsSkill) {
    // Partial compatibility if either condition is met
    factors.skillCompatibility = 75;
    score += 30;
  } else {
    factors.skillCompatibility = 0;
  }

  // Location proximity (20% weight)
  if (student.profile?.location && teacher.profile?.location) {
    // Simple string matching for now - can be enhanced with geocoding
    if (student.profile.location.toLowerCase() === teacher.profile.location.toLowerCase()) {
      factors.locationDistance = 100;
      score += 20;
    } else {
      factors.locationDistance = 50; // Different locations
      score += 10;
    }
  }

  // Rating score (25% weight)
  const teacherRating = teacher.ratings?.average || 0;
  if (teacherRating > 0) {
    factors.ratingScore = (teacherRating / 5) * 100;
    score += (teacherRating / 5) * 25;
  }

  // Experience level matching (15% weight)
  const levelScore = {
    'Beginner': { 'Beginner': 100, 'Intermediate': 80, 'Advanced': 60, 'Expert': 40 },
    'Intermediate': { 'Beginner': 60, 'Intermediate': 100, 'Advanced': 90, 'Expert': 70 },
    'Advanced': { 'Beginner': 40, 'Intermediate': 80, 'Advanced': 100, 'Expert': 90 },
    'Expert': { 'Beginner': 20, 'Intermediate': 60, 'Advanced': 80, 'Expert': 100 }
  };
  
  // Get student's target level for this skill
  const studentTargetLevel = 'Beginner'; // Default or extract from student's skill data
  // Get teacher's level for this skill
  const teacherLevel = skill.level || 'Beginner';
  
  if (levelScore[studentTargetLevel] && levelScore[studentTargetLevel][teacherLevel]) {
    factors.experienceLevel = levelScore[studentTargetLevel][teacherLevel];
    score += (factors.experienceLevel / 100) * 15;
  }

  return { score: Math.round(score), factors };
};

module.exports = mongoose.model('SkillMatch', skillMatchSchema);