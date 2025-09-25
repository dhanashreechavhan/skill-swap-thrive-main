const express = require('express');
const { auth } = require('../middleware/auth');
const { userValidation } = require('../middleware/validation');
const { upload, cleanupOldAvatar } = require('../middleware/upload');
const User = require('../models/UserEnhanced');
const router = express.Router();

// Helper to compute profile completion
function computeProfileCompletion(user) {
  if (!user) return 0;
  const hasBio = !!(user.profile && user.profile.bio && String(user.profile.bio).trim().length > 0);
  const hasTeach = Array.isArray(user.skillsTeaching) && user.skillsTeaching.length > 0;
  const hasLearn = Array.isArray(user.skillsLearning) && user.skillsLearning.length > 0;
  const hasAvatar = !!(user.profile && user.profile.avatar && String(user.profile.avatar).trim().length > 0);
  let completion = 0;
  if (hasBio) completion += 25;
  if (hasTeach) completion += 25;
  if (hasLearn) completion += 25;
  if (hasAvatar) completion += 25;
  return completion;
}

// Get current user's profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const plain = user.toObject();
    // Normalize avatar path for client
    if (plain.profile && plain.profile.avatar) {
      const current = plain.profile.avatar;
      plain.profile.avatar = current.startsWith('uploads/') ? current : `uploads/${current}`;
    }
    // Ensure profileCompletion is populated
    plain.profile = plain.profile || {};
    plain.profile.profileCompletion = computeProfileCompletion(plain);
    res.json(plain);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      message: 'We encountered an issue while loading your profile. Please refresh the page and try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Search users with filtering and sorting
router.get('/search', userValidation.search, async (req, res) => {
  try {
    const {
      search,
      skill,
      location,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Build query object
    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.bio': { $regex: search, $options: 'i' } }
      ];
    }

    // Skill filter (users who teach specific skill)
    if (skill) {
      // Escape special regex characters to prevent invalid regex patterns
      const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.skillsTeaching = { $in: [new RegExp(escapedSkill, 'i')] };
    }

    // Location filter
    if (location) {
      // Escape special regex characters to prevent invalid regex patterns
      const escapedLocation = location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query['profile.location'] = { $regex: escapedLocation, $options: 'i' };
    }

    // Exclude banned users
    query['profile.isBanned'] = { $ne: true };

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const users = await User.find(query)
      .select('-password')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Process users to normalize avatar paths and add profile completion
    const processedUsers = users.map(user => {
      const plain = user.toObject();
      if (plain.profile && plain.profile.avatar) {
        const current = plain.profile.avatar;
        plain.profile.avatar = current.startsWith('uploads/') ? current : `uploads/${current}`;
      }
      plain.profile = plain.profile || {};
      plain.profile.profileCompletion = computeProfileCompletion(plain);
      return plain;
    });

    res.json({
      users: processedUsers,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ 
      message: 'We encountered an issue while searching for users. Please try again with different search criteria.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Middleware to conditionally apply multer only for multipart/form-data
const conditionalUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.startsWith('multipart/form-data')) {
    upload.single('avatar')(req, res, (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ 
          error: true, 
          message: err.message 
        });
      }
      next();
    });
  } else {
    next();
  }
};

// Update user profile
router.put('/profile', auth, conditionalUpload, userValidation.updateProfile, async (req, res) => {
  try {
    const incoming = req.body;
    console.log('Received updates:', incoming);

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ 
        message: 'Your user profile could not be found. Please try logging in again.',
        field: 'user'
      });
    }

    // Handle avatar upload
    if (req.file) {
      // Clean up old avatar if exists
      if (user.profile && user.profile.avatar) {
        await cleanupOldAvatar(user.profile.avatar);
      }
      
      user.profile = user.profile || {};
      user.profile.avatar = req.file.filename;
      console.log('Avatar uploaded successfully:', req.file.filename, 'for user:', user._id);
    }

    // Bio
    if (typeof incoming.bio === 'string') {
      user.profile = user.profile || {};
      user.profile.bio = incoming.bio;
    }

    // Location
    if (typeof incoming.location === 'string') {
      user.profile = user.profile || {};
      user.profile.location = incoming.location;
    }

    // Availability
    if (incoming.availability) {
      user.profile = user.profile || {};
      user.profile.availability = incoming.availability;
    }

    // Social links
    if (incoming.socialLinks) {
      user.profile = user.profile || {};
      user.profile.socialLinks = incoming.socialLinks;
    }

    // Skills Teaching - handle both string arrays and JSON arrays
    if (incoming.skillsTeaching) {
      try {
        let skillsTeaching = [];
        if (typeof incoming.skillsTeaching === 'string') {
          // Try to parse as JSON array first
          try {
            skillsTeaching = JSON.parse(incoming.skillsTeaching);
          } catch (e) {
            // If parsing fails, treat as a single skill string
            skillsTeaching = [incoming.skillsTeaching];
          }
        } else if (Array.isArray(incoming.skillsTeaching)) {
          skillsTeaching = incoming.skillsTeaching;
        }
        
        // Convert simple string array to proper skill objects
        user.skillsTeaching = skillsTeaching.map(skill => {
          if (typeof skill === 'string') {
            return { skill: skill, level: 'Intermediate', isActive: true };
          }
          // If already an object with skill property, return as is
          if (typeof skill === 'object' && skill.skill) {
            return skill;
          }
          // Fallback for any other format
          return { skill: String(skill), level: 'Intermediate', isActive: true };
        });
      } catch (error) {
        console.error('Error processing skillsTeaching:', error);
      }
    }

    // Skills Learning - handle both string arrays and JSON arrays
    if (incoming.skillsLearning) {
      try {
        let skillsLearning = [];
        if (typeof incoming.skillsLearning === 'string') {
          // Try to parse as JSON array first
          try {
            skillsLearning = JSON.parse(incoming.skillsLearning);
          } catch (e) {
            // If parsing fails, treat as a single skill string
            skillsLearning = [incoming.skillsLearning];
          }
        } else if (Array.isArray(incoming.skillsLearning)) {
          skillsLearning = incoming.skillsLearning;
        }
        
        // Convert simple string array to proper skill objects
        user.skillsLearning = skillsLearning.map(skill => {
          if (typeof skill === 'string') {
            return { 
              skill: skill, 
              currentLevel: 'Beginner', 
              targetLevel: 'Intermediate',
              urgency: 'Medium'
            };
          }
          // If already an object with skill property, return as is
          if (typeof skill === 'object' && skill.skill) {
            return skill;
          }
          // Fallback for any other format
          return { 
            skill: String(skill), 
            currentLevel: 'Beginner', 
            targetLevel: 'Intermediate',
            urgency: 'Medium'
          };
        });
      } catch (error) {
        console.error('Error processing skillsLearning:', error);
      }
    }

    // Save user
    await user.save();

    // Return updated user (without password)
    const updatedUser = await User.findById(req.user._id).select('-password');
    const plain = updatedUser.toObject();
    
    // Normalize avatar path for client
    if (plain.profile && plain.profile.avatar) {
      const current = plain.profile.avatar;
      plain.profile.avatar = current.startsWith('uploads/') ? current : `uploads/${current}`;
    }
    
    // Ensure profileCompletion is populated
    plain.profile = plain.profile || {};
    plain.profile.profileCompletion = computeProfileCompletion(plain);
    
    res.json(plain);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      message: 'We encountered an issue while updating your profile. Please check your information and try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;