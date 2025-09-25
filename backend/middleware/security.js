const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

// Rate limiting configurations
const createRateLimiter = (options) => {
  const defaults = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        message: 'Please try again later',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    }
  };

  return rateLimit({ ...defaults, ...options });
};

// Different rate limits for different endpoints
const rateLimiters = {
  // General API rate limit - more permissive for regular usage
  general: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes per IP
    message: 'Too many requests from this IP, please try again later.'
  }),

  // Authentication rate limit - stricter for login/register
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 login/register attempts per 15 minutes per IP
    message: 'Too many authentication attempts, please try again in 15 minutes.',
    skipSuccessfulRequests: true // Don't count successful auth attempts
  }),

  // Strict rate limit for sensitive operations
  strict: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 requests per hour per IP
    message: 'Too many requests for this sensitive operation, please try again in an hour.'
  }),

  // Password reset rate limit
  passwordReset: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset attempts per hour per IP
    message: 'Too many password reset attempts, please try again in an hour.'
  }),

  // File upload rate limit
  upload: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 file uploads per minute per IP
    message: 'Too many file uploads, please try again in a minute.'
  }),

  // Search rate limit - higher limit for search operations
  search: createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 search requests per minute per IP
    message: 'Too many search requests, please slow down.'
  }),

  // Admin rate limit - allows multiple concurrent dashboard requests
  admin: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per 15 minutes per IP (allows for dashboard loading + normal admin operations)
    message: 'Too many admin requests, please try again later.'
  })
};

// Security headers configuration
const securityHeaders = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "fonts.gstatic.com"],
        connectSrc: ["'self'", "http://localhost:8080", "http://127.0.0.1:8080"],
        manifestSrc: ["'self'"],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        childSrc: ["'none'"],
        workerSrc: ["'none'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"]
      },
      // More permissive in development
      reportOnly: isDevelopment
    },

    // HTTP Strict Transport Security - only in production
    hsts: !isDevelopment && {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },

    // Referrer Policy
    referrerPolicy: { policy: 'same-origin' },

    // X-Frame-Options
    frameguard: { action: 'deny' },

    // X-Content-Type-Options
    noSniff: true,

    // X-XSS-Protection
    xssFilter: true,

    // Hide X-Powered-By header
    hidePoweredBy: true,

    // DNS Prefetch Control
    dnsPrefetchControl: { allow: false },

    // Expect-CT header
    expectCt: !isDevelopment && {
      maxAge: 86400, // 24 hours
      enforce: true
    },

    // Permission Policy (Feature Policy)
    permittedCrossDomainPolicies: false,

    // Cross-Origin-Embedder-Policy
    crossOriginEmbedderPolicy: false // Set to true if needed
  });
};

// MongoDB injection protection
const mongodbSanitization = () => {
  return mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`⚠️  MongoDB injection attempt detected from ${req.ip}:`, key);
    }
  });
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Remove null bytes from strings to prevent null byte injection
  const sanitizeString = (str) => {
    if (typeof str === 'string') {
      return str.replace(/\0/g, '');
    }
    return str;
  };

  // Recursively sanitize object properties
  const sanitizeObject = (obj) => {
    if (obj === null || typeof obj !== 'object') {
      return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleanKey = sanitizeString(key);
      sanitized[cleanKey] = sanitizeObject(value);
    }
    return sanitized;
  };

  // Sanitize request body, query, and params
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Request size limiting middleware
const requestSizeLimiter = (req, res, next) => {
  const contentLength = parseInt(req.get('content-length') || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB limit

  if (contentLength > maxSize) {
    return res.status(413).json({
      error: 'Request too large',
      message: 'Request body exceeds maximum allowed size',
      maxSize: '10MB'
    });
  }

  next();
};

// Security logging middleware
const securityLogger = (req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Log suspicious activities
  const suspiciousPatterns = [
    /\.\.\//g, // Path traversal
    /<script/gi, // XSS attempt
    /union.*select/gi, // SQL injection
    /javascript:/gi, // JavaScript protocol
    /eval\(/gi, // Eval attempts
    /document\./gi, // DOM manipulation
    /window\./gi, // Window object access
  ];

  const checkSuspiciousContent = (obj) => {
    const content = JSON.stringify(obj);
    return suspiciousPatterns.some(pattern => pattern.test(content));
  };

  let isSuspicious = false;
  if (req.body && checkSuspiciousContent(req.body)) isSuspicious = true;
  if (req.query && checkSuspiciousContent(req.query)) isSuspicious = true;
  if (req.params && checkSuspiciousContent(req.params)) isSuspicious = true;

  if (isSuspicious) {
    console.warn('🚨 Suspicious request detected:', {
      ip: req.ip,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      body: isDevelopment ? req.body : '[REDACTED]',
      query: isDevelopment ? req.query : '[REDACTED]'
    });
  }

  next();
};

// Brute force protection for specific users
const createUserRateLimit = () => {
  const userAttempts = new Map();
  const WINDOW_SIZE = 15 * 60 * 1000; // 15 minutes
  const MAX_ATTEMPTS = 5;

  return (req, res, next) => {
    if (!req.body.email) return next();

    const email = req.body.email.toLowerCase();
    const now = Date.now();
    const userRecord = userAttempts.get(email) || { count: 0, resetTime: now + WINDOW_SIZE };

    // Reset counter if window expired
    if (now > userRecord.resetTime) {
      userRecord.count = 0;
      userRecord.resetTime = now + WINDOW_SIZE;
    }

    // Check if user exceeded limit
    if (userRecord.count >= MAX_ATTEMPTS) {
      return res.status(429).json({
        error: 'Too many failed attempts',
        message: `Account temporarily locked. Try again in ${Math.ceil((userRecord.resetTime - now) / 60000)} minutes.`,
        retryAfter: Math.ceil((userRecord.resetTime - now) / 1000)
      });
    }

    userAttempts.set(email, userRecord);

    // Increment counter on failed auth (handled in error middleware or auth routes)
    res.on('finish', () => {
      if (res.statusCode === 400 || res.statusCode === 401) {
        userRecord.count++;
        userAttempts.set(email, userRecord);
      } else if (res.statusCode === 200) {
        // Reset on successful auth
        userAttempts.delete(email);
      }
    });

    next();
  };
};

// Error handling for security middleware
const securityErrorHandler = (err, req, res, next) => {
  // Rate limiting errors
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Request too large',
      message: 'Request body exceeds maximum allowed size'
    });
  }

  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    console.warn(`🚫 CORS violation from ${req.ip}: ${req.get('origin')}`);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'CORS policy violation'
    });
  }

  // Other security-related errors
  if (err.type === 'security') {
    return res.status(400).json({
      error: 'Security violation',
      message: err.message
    });
  }

  next(err);
};

module.exports = {
  rateLimiters,
  securityHeaders,
  mongodbSanitization,
  sanitizeInput,
  requestSizeLimiter,
  securityLogger,
  createUserRateLimit,
  securityErrorHandler
};