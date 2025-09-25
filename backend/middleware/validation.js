const { body, param, query, validationResult } = require('express-validator');

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    return res.status(400).json({
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  next();
};

// Common validation patterns
const commonValidators = {
  email: body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  password: body('password')
    .isLength({ min: 4 })
    .withMessage('Password must be at least 4 characters long'),
  
  name: body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-'\._@]+$/)
    .withMessage('Name can contain letters, numbers, spaces, and common symbols'),
  
  mongoId: param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  optionalString: (field, maxLength = 1000) => 
    body(field)
      .optional()
      .trim()
      .isLength({ max: maxLength })
      .withMessage(`${field} must be less than ${maxLength} characters`),
  
  requiredString: (field, minLength = 1, maxLength = 1000) =>
    body(field)
      .trim()
      .isLength({ min: minLength, max: maxLength })
      .withMessage(`${field} must be between ${minLength} and ${maxLength} characters`),
  
  arrayOfStrings: (field, maxItems = 20, maxItemLength = 100) =>
    body(field)
      .optional()
      .isArray({ max: maxItems })
      .withMessage(`${field} must be an array with maximum ${maxItems} items`)
      .custom((arr) => {
        if (!Array.isArray(arr)) return true;
        return arr.every(item => 
          typeof item === 'string' && 
          item.trim().length > 0 && 
          item.trim().length <= maxItemLength
        );
      })
      .withMessage(`Each ${field} item must be a non-empty string with maximum ${maxItemLength} characters`)
};

// Auth validation schemas
const authValidation = {
  register: () => [
    commonValidators.name,
    commonValidators.email,
    commonValidators.password,
    handleValidationErrors
  ],
  
  login: () => [
    commonValidators.email,
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ],

  email: () => [
    commonValidators.email,
    handleValidationErrors
  ],

  resetPassword: () => [
    body('password')
      .isLength({ min: 4 })
      .withMessage('Password must be at least 4 characters long'),
    handleValidationErrors
  ],

  changePassword: () => [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 4 })
      .withMessage('New password must be at least 4 characters long'),
    handleValidationErrors
  ]
};

// User validation schemas
const userValidation = {
  updateProfile: [
    body('name').optional().trim(),
    body('email').optional().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('bio').optional().trim(),
    body('profile').optional(),
    body('skillsTeaching').optional(),
    body('skillsLearning').optional(),
    body('location').optional().trim(),
    body('availability').optional(),
    body('experience').optional(),
    body('preferences').optional(),
    handleValidationErrors
  ],
  
  search: [
    query('search').optional().trim(),
    query('skill').optional().trim(),
    query('location').optional().trim(),
    query('sortBy').optional(),
    query('sortOrder').optional(),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
    query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be positive'),
    handleValidationErrors
  ],
  
  getUserById: [
    commonValidators.mongoId,
    handleValidationErrors
  ],
  
  bootstrapAdmin: [
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    handleValidationErrors
  ]
};

// Skill validation schemas
const skillValidation = {
  create: [
    body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
    body('description').optional().trim(),
    body('category').optional(),
    body('level').optional(),
    body('yearsExperience').optional().isInt({ min: 0, max: 50 }).withMessage('Years of experience must be between 0 and 50'),
    body('availability').optional(),
    body('availabilityDescription').optional().trim().isLength({ max: 500 }).withMessage('Availability description must be less than 500 characters'),
    body('tags').optional(),
    body('location').optional().trim(),
    body('isRemote').optional(),
    body('pricing').optional(),
    handleValidationErrors
  ],
  
  update: [
    param('id').optional().isMongoId().withMessage('Invalid ID'),
    body('name').optional().trim(),
    body('description').optional().trim(),
    body('category').optional(),
    body('level').optional(),
    body('yearsExperience').optional().isInt({ min: 0, max: 50 }).withMessage('Years of experience must be between 0 and 50'),
    body('availability').optional(),
    body('availabilityDescription').optional().trim().isLength({ max: 500 }).withMessage('Availability description must be less than 500 characters'),
    body('tags').optional(),
    body('location').optional().trim(),
    body('isRemote').optional(),
    handleValidationErrors
  ],
  
  getById: [
    commonValidators.mongoId,
    handleValidationErrors
  ],
  
  delete: [
    commonValidators.mongoId,
    handleValidationErrors
  ],
  
  search: [
    query('search')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Search query must be less than 100 characters')
      .escape(),
    query('category')
      .optional()
      .isIn(['all', 'technology', 'language', 'art', 'music', 'sports', 'cooking', 'academic', 'business', 'other', 'Technology', 'Language', 'Art', 'Music', 'Sports', 'Cooking', 'Academic', 'Business', 'Other'])
      .withMessage('Invalid category'),
    query('level')
      .optional()
      .isIn(['all', 'Beginner', 'Intermediate', 'Advanced', 'Expert'])
      .withMessage('Invalid level'),
    query('availability')
      .optional()
      .isIn(['all', 'Weekdays', 'Weekends', 'Flexible'])
      .withMessage('Invalid availability'),
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'name', 'category', 'level'])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc'),
    query('page')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Page must be a positive integer less than 1000'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
  ]
};

// Message validation schemas (if messages route exists)
const messageValidation = {
  create: [
    commonValidators.requiredString('content', 1, 2000),
    body('recipientId')
      .isMongoId()
      .withMessage('Invalid recipient ID'),
    body('subject')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Subject must be less than 200 characters'),
    handleValidationErrors
  ],
  
  getById: [
    commonValidators.mongoId,
    handleValidationErrors
  ]
};

// Schedule validation schemas (if schedules route exists)
const scheduleValidation = {
  create: [
    body('skillId')
      .isMongoId()
      .withMessage('Invalid skill ID'),
    body('studentId')
      .isMongoId()
      .withMessage('Invalid student ID'),
    body('startTime')
      .isISO8601()
      .withMessage('Start time must be a valid ISO 8601 date'),
    body('endTime')
      .isISO8601()
      .withMessage('End time must be a valid ISO 8601 date')
      .custom((endTime, { req }) => {
        const start = new Date(req.body.startTime);
        const end = new Date(endTime);
        if (end <= start) {
          throw new Error('End time must be after start time');
        }
        if (end.getTime() - start.getTime() > 8 * 60 * 60 * 1000) {
          throw new Error('Session cannot be longer than 8 hours');
        }
        return true;
      }),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes must be less than 500 characters'),
    handleValidationErrors
  ],
  
  update: [
    commonValidators.mongoId,
    body('status')
      .optional()
      .isIn(['pending', 'confirmed', 'completed', 'cancelled'])
      .withMessage('Invalid status'),
    body('startTime')
      .optional()
      .isISO8601()
      .withMessage('Start time must be a valid ISO 8601 date'),
    body('endTime')
      .optional()
      .isISO8601()
      .withMessage('End time must be a valid ISO 8601 date'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes must be less than 500 characters'),
    handleValidationErrors
  ]
};

// Admin validation schemas
const adminValidation = {
  banUser: [
    commonValidators.mongoId,
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Reason must be less than 500 characters'),
    handleValidationErrors
  ],
  
  unbanUser: [
    commonValidators.mongoId,
    handleValidationErrors
  ],
  
  deleteUser: [
    commonValidators.mongoId,
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Reason must be less than 500 characters'),
    handleValidationErrors
  ],
  
  getUsers: [
    query('page')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Page must be a positive integer less than 1000'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('search')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Search query must be less than 100 characters')
      .escape(),
    query('status')
      .optional()
      .isIn(['all', 'active', 'banned'])
      .withMessage('Invalid status filter'),
    handleValidationErrors
  ]
};

module.exports = {
  authValidation,
  userValidation,
  skillValidation,
  messageValidation,
  scheduleValidation,
  adminValidation,
  handleValidationErrors,
  commonValidators
};