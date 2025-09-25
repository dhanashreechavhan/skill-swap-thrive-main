const express = require('express');
const router = express.Router();
const User = require('../models/UserEnhanced');
const Skill = require('../models/Skill');
const SkillMatch = require('../models/SkillMatch');
const Rating = require('../models/Rating');
const { auth } = require('../middleware/auth');

// Function to categorize skills based on skill name
function categorizeSkill(skillName) {
  const skillLower = skillName.toLowerCase();
  
  // Technology category
  const techKeywords = ['javascript', 'python', 'java', 'react', 'node', 'html', 'css', 'programming', 'coding', 'software', 'web', 'app', 'development', 'database', 'sql', 'api', 'framework', 'library', 'algorithm', 'data structure', 'machine learning', 'ai', 'artificial intelligence', 'cloud', 'devops', 'git', 'github', 'typescript', 'angular', 'vue', 'php', 'c++', 'c#', 'swift', 'kotlin', 'flutter', 'django', 'flask', 'spring', 'laravel', 'mongodb', 'mysql', 'postgresql', 'redis', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'blockchain', 'cybersecurity', 'testing', 'automation'];
  
  // Language category
  const languageKeywords = ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'korean', 'italian', 'portuguese', 'russian', 'arabic', 'hindi', 'language', 'grammar', 'vocabulary', 'pronunciation', 'speaking', 'writing', 'reading', 'listening', 'translation', 'interpretation'];
  
  // Art category
  const artKeywords = ['drawing', 'painting', 'sculpture', 'photography', 'design', 'graphic design', 'illustration', 'animation', 'digital art', 'traditional art', 'watercolor', 'oil painting', 'acrylic', 'sketching', 'portrait', 'landscape', 'abstract', 'fine art', 'visual art', 'creative', 'artistic'];
  
  // Music category
  const musicKeywords = ['piano', 'guitar', 'violin', 'drums', 'singing', 'vocal', 'music theory', 'composition', 'songwriting', 'music production', 'audio', 'sound', 'recording', 'mixing', 'mastering', 'instrument', 'melody', 'harmony', 'rhythm', 'classical', 'jazz', 'rock', 'pop', 'electronic', 'hip hop'];
  
  // Sports category
  const sportsKeywords = ['football', 'soccer', 'basketball', 'tennis', 'swimming', 'running', 'cycling', 'yoga', 'fitness', 'gym', 'workout', 'exercise', 'training', 'athletics', 'baseball', 'volleyball', 'badminton', 'table tennis', 'martial arts', 'boxing', 'wrestling', 'golf', 'hockey', 'cricket', 'rugby', 'skiing', 'snowboarding', 'surfing', 'climbing', 'hiking', 'dance', 'ballet', 'pilates', 'crossfit', 'bodybuilding', 'powerlifting'];
  
  // Cooking category
  const cookingKeywords = ['cooking', 'baking', 'recipe', 'culinary', 'chef', 'kitchen', 'food', 'cuisine', 'nutrition', 'diet', 'meal prep', 'pastry', 'dessert', 'bread', 'cake', 'pasta', 'sauce', 'grilling', 'roasting', 'frying', 'steaming', 'fermentation', 'wine', 'cocktail', 'beverage', 'organic', 'vegan', 'vegetarian'];
  
  // Check each category
  if (techKeywords.some(keyword => skillLower.includes(keyword))) {
    return 'Technology';
  }
  if (languageKeywords.some(keyword => skillLower.includes(keyword))) {
    return 'Language';
  }
  if (artKeywords.some(keyword => skillLower.includes(keyword))) {
    return 'Art';
  }
  if (musicKeywords.some(keyword => skillLower.includes(keyword))) {
    return 'Music';
  }
  if (sportsKeywords.some(keyword => skillLower.includes(keyword))) {
    return 'Sports';
  }
  if (cookingKeywords.some(keyword => skillLower.includes(keyword))) {
    return 'Cooking';
  }
  
  // Default to 'Other' if no specific category found
  return 'Other';
}

// Simple test route
router.get('/test', (req, res) => {
  res.json({ message: 'Matching routes working!' });
});

// Get skill matches for current user
router.get('/matches', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 10, page = 1, skillName, category, minScore = 30 } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build query filter
    const filter = { 
      student: userId, 
      matchScore: { $gte: parseInt(minScore) },
      status: { $in: ['Active', 'Contacted'] }  // Show both active and contacted matches
    };
    
    // If specific skill or category requested
    if (skillName || category) {
      let skillFilter = {};
      if (skillName) {
        // Escape special regex characters to prevent invalid regex patterns
        const escapedSkillName = skillName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        skillFilter.name = new RegExp(escapedSkillName, 'i');
      }
      if (category) skillFilter.category = category;
      
      const matchingSkills = await Skill.find(skillFilter);
      filter.skill = { $in: matchingSkills.map(s => s._id) };
    }
    
    const matches = await SkillMatch.find(filter)
      .populate({
        path: 'teacher',
        select: 'name email profile skillsTeaching',
        populate: {
          path: 'profile'
        }
      })
      .populate({
        path: 'skill',
        select: 'name description category level tags'
      })
      .sort({ matchScore: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    // Get teacher ratings for each match
    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        const teacherRating = await Rating.getAverageRating(match.teacher._id);
        return {
          ...match.toObject(),
          teacher: {
            ...match.teacher.toObject(),
            rating: teacherRating
          }
        };
      })
    );
    
    const total = await SkillMatch.countDocuments(filter);
    
    res.json({
      matches: enrichedMatches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ 
      message: 'We encountered an issue while loading your matches. Please refresh the page and try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Generate new matches for user
router.post('/generate', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        message: 'Your user profile could not be found. Please try logging in again.',
        field: 'user'
      });
    }
    
    // Clear existing active matches for this user
    await SkillMatch.deleteMany({ student: userId, status: 'Active' });
    
    // Find skills user wants to learn - handle both old string format and new object format
    const skillsToMatch = user.skillsLearning || [];
    
    if (skillsToMatch.length === 0) {
      return res.json({ 
        message: 'No learning interests found in your profile. Please add skills you want to learn to discover potential teachers.', 
        error: 'NO_LEARNING_SKILLS',
        suggestion: 'Visit your profile page to add learning interests'
      });
    }
    
    const newMatches = [];
    let totalAvailableSkills = 0;
    
    // For each skill the user wants to learn
    for (const skillItem of skillsToMatch) {
      // Extract skill name - handle both string format (legacy) and object format (new)
      let skillName;
      if (typeof skillItem === 'string') {
        skillName = skillItem;
      } else if (typeof skillItem === 'object' && skillItem.skill) {
        skillName = skillItem.skill;
      } else {
        console.warn('Invalid skill format:', skillItem);
        continue; // Skip invalid skill formats
      }
      
      // Find users who teach this skill
      const teachers = await User.find({
        'skillsTeaching.skill': { $regex: new RegExp(skillName, 'i') },
        _id: { $ne: userId } // Exclude user's own skills
      });
      
      totalAvailableSkills += teachers.length;
      
      // Generate matches for each teacher
      for (const teacher of teachers) {
        // Skip if teacher is banned
        if (teacher.profile?.isBanned) continue;
        
        // Calculate match score using the SkillMatch static method
        // First, find or create a skill object for this matching skill
        let skillDoc = await Skill.findOne({ name: { $regex: new RegExp(skillName, 'i') } });
        
        if (!skillDoc) {
          // Find the specific skill in teacher's skills for level info
          const matchingSkill = teacher.skillsTeaching.find(s => 
            (typeof s === 'string' ? s : s.skill)?.toLowerCase() === skillName.toLowerCase()
          );
          
          // Create a basic skill document if it doesn't exist
          skillDoc = new Skill({
            name: skillName,
            description: `Skill: ${skillName}`,
            category: categorizeSkill(skillName),
            level: (matchingSkill && typeof matchingSkill === 'object') ? matchingSkill.level : 'Intermediate',
            offeredBy: teacher._id
          });
          await skillDoc.save();
        }
        
        const matchData = SkillMatch.calculateMatchScore(user, teacher, skillDoc);
        
        // Only create matches with decent scores
        if (matchData.score >= 30) {
          const match = new SkillMatch({
            student: userId,
            teacher: teacher._id,
            skill: skillDoc._id,
            matchScore: matchData.score,
            factors: matchData.factors
          });
          
          const savedMatch = await match.save();
          newMatches.push(savedMatch);
        }
      }
    }
    
    // Also check for reverse matches - users who want to learn what this user teaches
    const teachingSkills = user.skillsTeaching || [];
    
    for (const skillItem of teachingSkills) {
      // Extract skill name - handle both string format (legacy) and object format (new)
      let skillName;
      if (typeof skillItem === 'string') {
        skillName = skillItem;
      } else if (typeof skillItem === 'object' && skillItem.skill) {
        skillName = skillItem.skill;
      } else {
        console.warn('Invalid teaching skill format:', skillItem);
        continue; // Skip invalid skill formats
      }
      
      // Find users who want to learn this skill
      const students = await User.find({
        'skillsLearning.skill': { $regex: new RegExp(skillName, 'i') },
        _id: { $ne: userId } // Exclude user's own skills
      });
      
      // Generate matches for each student
      for (const student of students) {
        // Skip if student is banned
        if (student.profile?.isBanned) continue;
        
        // Calculate match score using the SkillMatch static method
        // First, find or create a skill object for this matching skill
        let skillDoc = await Skill.findOne({ name: { $regex: new RegExp(skillName, 'i') } });
        
        if (!skillDoc) {
          // Find the specific skill in student's learning skills for level info
          const matchingSkill = student.skillsLearning.find(s => 
            (typeof s === 'string' ? s : s.skill)?.toLowerCase() === skillName.toLowerCase()
          );
          
          // Create a basic skill document if it doesn't exist
          skillDoc = new Skill({
            name: skillName,
            description: `Skill: ${skillName}`,
            category: categorizeSkill(skillName),
            level: (matchingSkill && typeof matchingSkill === 'object') ? matchingSkill.currentLevel || 'Beginner' : 'Beginner',
            offeredBy: userId  // The current user is offering this skill
          });
          await skillDoc.save();
        }
        
        const matchData = SkillMatch.calculateMatchScore(student, { ...user.toObject(), _id: userId }, skillDoc);
        
        // Only create matches with decent scores
        if (matchData.score >= 30) {
          const match = new SkillMatch({
            student: student._id,
            teacher: userId,
            skill: skillDoc._id,
            matchScore: matchData.score,
            factors: matchData.factors
          });
          
          const savedMatch = await match.save();
          newMatches.push(savedMatch);
        }
      }
    }
    
    // If no available skills were found for any of the learning interests
    if (totalAvailableSkills === 0) {
      return res.json({ 
        message: 'No teachers found for your learning interests. Try adding different skills or check back later as new teachers join regularly.', 
        error: 'NO_AVAILABLE_SKILLS',
        suggestion: 'Consider adding more popular skills or expanding your interests'
      });
    }
    
    // If skills were found but no matches met the minimum score threshold
    if (totalAvailableSkills > 0 && newMatches.length === 0) {
      return res.json({ 
        message: 'We found potential teachers for your interests, but none met our quality standards. Try completing your profile or adding more learning interests.', 
        error: 'NO_QUALITY_MATCHES',
        suggestion: 'Complete your profile bio, add a profile picture, or specify more learning interests'
      });
    }
    
    res.json({
      message: `Generated ${newMatches.length} new matches`,
      matchCount: newMatches.length
    });
  } catch (error) {
    console.error('Generate matches error:', error);
    res.status(500).json({ 
      message: 'We encountered an issue while generating your matches. Please try again in a few moments.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Express interest in a match
router.post('/matches/:matchId/interested', auth, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user._id;
    
    const match = await SkillMatch.findOne({ 
      _id: matchId, 
      student: userId 
    });
    
    if (!match) {
      return res.status(404).json({ 
        message: 'This match could not be found or may no longer be available.',
        field: 'match'
      });
    }
    
    match.studentInterested = true;
    match.lastContactDate = new Date();
    
    // If both parties are interested, update status
    if (match.teacherInterested) {
      match.status = 'Contacted';
    }
    
    await match.save();
    
    res.json({ message: 'Interest recorded', match });
  } catch (error) {
    console.error('Express interest error:', error);
    res.status(500).json({ 
      message: 'We encountered an issue while recording your interest. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Decline a match
router.post('/matches/:matchId/decline', auth, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user._id;
    
    const match = await SkillMatch.findOne({ 
      _id: matchId, 
      student: userId 
    });
    
    if (!match) {
      return res.status(404).json({ 
        message: 'This match could not be found or may no longer be available.',
        field: 'match'
      });
    }
    
    match.status = 'Declined';
    await match.save();
    
    res.json({ message: 'Match declined' });
  } catch (error) {
    console.error('Decline match error:', error);
    res.status(500).json({ 
      message: 'We encountered an issue while declining this match. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get matching statistics for user
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const stats = await SkillMatch.aggregate([
      { $match: { student: new (require('mongoose')).Types.ObjectId(String(userId)) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgScore: { $avg: '$matchScore' }
        }
      }
    ]);
    
    const totalMatches = await SkillMatch.countDocuments({ student: userId });
    const interestedMatches = await SkillMatch.countDocuments({ 
      student: userId, 
      studentInterested: true 
    });
    
    res.json({
      totalMatches,
      interestedMatches,
      statusBreakdown: stats,
      interestRate: totalMatches > 0 ? (interestedMatches / totalMatches * 100).toFixed(1) : 0
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      message: 'We encountered an issue while loading your statistics. Please refresh the page and try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// For teachers - get students interested in their skills
router.get('/interested-students', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const matches = await SkillMatch.find({
      teacher: userId,
      studentInterested: true,
      status: { $in: ['Active', 'Contacted'] }
    })
    .populate({
      path: 'student',
      select: 'name email profile skillsLearning'
    })
    .populate({
      path: 'skill',
      select: 'name description category'
    })
    .sort({ lastContactDate: -1, matchScore: -1 });
    
    res.json({ interestedStudents: matches });
  } catch (error) {
    console.error('Get interested students error:', error);
    res.status(500).json({ 
      message: 'We encountered an issue while loading interested students. Please refresh the page and try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Teacher expresses interest back
router.post('/students/:matchId/accept', auth, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user._id;
    
    const match = await SkillMatch.findOne({
      _id: matchId,
      teacher: userId,
      studentInterested: true
    });
    
    if (!match) {
      return res.status(404).json({ 
        message: 'This match could not be found or may no longer be available.',
        field: 'match'
      });
    }
    
    match.teacherInterested = true;
    match.status = 'Contacted';
    match.lastContactDate = new Date();
    
    await match.save();
    
    res.json({ message: 'Student accepted', match });
  } catch (error) {
    console.error('Accept student error:', error);
    res.status(500).json({ 
      message: 'We encountered an issue while accepting this student. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Advanced matching with filters
router.post('/advanced-search', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      skills = [],
      categories = [],
      locations = [],
      levels = [],
      minRating = 0,
      maxDistance = null,
      availability = null,
      limit = 20
    } = req.body;
    
    // Build skill filter
    let skillFilter = { availability: 'Available', offeredBy: { $ne: userId } };
    
    if (skills.length > 0) {
      // Escape special regex characters to prevent invalid regex patterns
      const escapedSkills = skills.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      skillFilter.name = { $in: escapedSkills.map(s => new RegExp(s, 'i')) };
    }
    
    if (categories.length > 0) {
      skillFilter.category = { $in: categories };
    }
    
    if (levels.length > 0) {
      skillFilter.level = { $in: levels };
    }
    
    // Find matching skills
    const matchingSkills = await Skill.find(skillFilter)
      .populate({
        path: 'offeredBy',
        match: {
          'profile.isBanned': { $ne: true }
        }
      });
    
    // Filter by location and rating
    const potentialMatches = [];
    const user = await User.findById(userId);
    
    for (const skill of matchingSkills) {
      if (!skill.offeredBy) continue;
      
      const teacher = skill.offeredBy;
      
      // Location filter
      if (locations.length > 0 && teacher.profile?.location) {
        const teacherLocation = teacher.profile.location.toLowerCase();
        const hasMatchingLocation = locations.some(loc => 
          teacherLocation.includes(loc.toLowerCase())
        );
        if (!hasMatchingLocation) continue;
      }
      
      // Rating filter
      if (minRating > 0) {
        const teacherRating = await Rating.getAverageRating(teacher._id);
        if (teacherRating.averageRating < minRating) continue;
      }
      
      // Calculate match score
      const matchData = SkillMatch.calculateMatchScore(user, teacher, skill);
      
      potentialMatches.push({
        skill,
        teacher,
        matchScore: matchData.score,
        factors: matchData.factors
      });
    }
    
    // Sort by match score
    potentialMatches.sort((a, b) => b.matchScore - a.matchScore);
    
    // Limit results
    const results = potentialMatches.slice(0, limit);
    
    res.json({
      matches: results,
      totalFound: potentialMatches.length,
      searchCriteria: req.body
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ 
      message: 'We encountered an issue while searching. Please try again with different criteria.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;