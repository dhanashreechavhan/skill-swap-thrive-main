const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const {
  rateLimiters,
  securityHeaders,
  mongodbSanitization,
  sanitizeInput,
  requestSizeLimiter,
  securityLogger,
  createUserRateLimit,
  securityErrorHandler
} = require('./middleware/security');

// Load environment variables
dotenv.config();

const app = express();

// Enable trust proxy for rate limiting to work correctly behind proxies (like Render)
app.set('trust proxy', 1);

// Security middleware - Apply first
app.use(securityHeaders());
app.use(securityLogger);
app.use(requestSizeLimiter);
app.use(rateLimiters.general); // General rate limiting

// Middleware - CORS Configuration
// Environment-based CORS configuration
const isDevelopment = process.env.NODE_ENV === 'development';

// Development allowed origins
const developmentOrigins = [
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

// Production allowed origins (add your production domains here)
const productionOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2, // Secondary domain if needed
  // Add your production domains here
  // 'https://yourapp.com',
  // 'https://www.yourapp.com',
  // 'https://app.yourapp.com',
  'https://skillswapthrive.netlify.app', // Your Netlify frontend URL
  'https://skillswapthrive.netlify.app/', // Your Netlify frontend URL with trailing slash
  'https://skillswapthrive.netlify.app', // Duplicate without trailing slash for redundancy
].filter(Boolean); // Remove undefined/empty values

const allowedOrigins = isDevelopment ? developmentOrigins : productionOrigins;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin in development (like mobile apps, Postman, curl)
    if (!origin && isDevelopment) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Also check if origin matches but with/without trailing slash
    const normalizedOrigin = origin && origin.endsWith('/') ? origin.slice(0, -1) : origin;
    const normalizedAllowedOrigins = allowedOrigins.map(allowedOrigin => 
      allowedOrigin && allowedOrigin.endsWith('/') ? allowedOrigin.slice(0, -1) : allowedOrigin
    );
    
    if (normalizedAllowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    
    // For development only: allow any localhost or 127.0.0.1 origin
    if (isDevelopment && origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }
    
    // Log blocked requests in production for monitoring
    if (!isDevelopment && origin) {
      console.log(`🚫 CORS blocked request from origin: ${origin}`);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  // Additional security headers
  preflightContinue: false,
}));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB sanitization and input sanitization
app.use(mongodbSanitization());
app.use(sanitizeInput);

// Serve static files from uploads directory with secure CORS and Resource Policy
app.use('/uploads', (req, res, next) => {
  // Dynamically allow dev origins and configured allowed origins for image fetches
  const origin = req.headers.origin;
  const isLocal = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));
  if (origin && (isLocal || allowedOrigins.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else if (!origin && isDevelopment) {
    // No origin (e.g., curl) in dev
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  // Add Cross-Origin Resource Policy header
  // In development, we'll use cross-origin to allow access from different ports
  res.setHeader('Cross-Origin-Resource-Policy', isDevelopment ? 'cross-origin' : 'same-site');
  
  // Add additional security headers
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});
app.use('/uploads', express.static('uploads', {
  setHeaders: (res) => {
    // Ensure these headers are also set when serving static files
    res.setHeader('Cross-Origin-Resource-Policy', isDevelopment ? 'cross-origin' : 'same-site');
  }
}));

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap';

// Check if required environment variables are set
if (!process.env.MONGODB_URI) {
  console.log('⚠️  Warning: MONGODB_URI not set in environment variables');
  console.log('   Using fallback: mongodb://localhost:27017/skillswap');
  console.log('   To use a cloud database, run: npm run setup');
  console.log('');
}

if (!process.env.JWT_SECRET) {
  console.log('⚠️  Warning: JWT_SECRET not set in environment variables');
  console.log('   Authentication may not work properly');
  console.log('   Run: npm run setup');
  console.log('');
}

// CORS configuration logging
console.log('🌐 CORS Configuration:');
console.log('   Environment:', isDevelopment ? 'Development' : 'Production');
if (isDevelopment) {
  console.log('   Allowed origins: localhost/127.0.0.1 (development mode)');
} else {
  if (productionOrigins.length > 0) {
    console.log('   Allowed origins:', productionOrigins.join(', '));
  } else {
    console.log('⚠️  Warning: No production origins configured!');
    console.log('   Set FRONTEND_URL in environment variables for production');
  }
}
console.log('');

// Production environment validation
if (!isDevelopment) {
  if (!process.env.FRONTEND_URL) {
    console.log('⚠️  Warning: FRONTEND_URL not set for production!');
    console.log('   This may cause CORS issues in production');
    console.log('');
  }
}

console.log('🔗 Attempting to connect to MongoDB...');
console.log('   URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('📊 Database ready for operations');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('');
  console.log('🔧 Troubleshooting:');
  console.log('   1. Make sure MongoDB is running (if using local)');
  console.log('   2. Check your connection string in .env file');
  console.log('   3. For MongoDB Atlas, verify network access and credentials');
  console.log('   4. Run "npm run setup" to configure environment variables');
  console.log('');
  process.exit(1);
});

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const skillRoutes = require('./routes/skills');
const messageRoutes = require('./routes/messages');
const scheduleRoutes = require('./routes/schedules');
const adminRoutes = require('./routes/admin');
const matchingRoutes = require('./routes/matching');
const ratingRoutes = require('./routes/ratings');

// User-specific rate limiting for authentication
const userRateLimit = createUserRateLimit();

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Skill Swap API' });
});

// Health check endpoint for Render free tier (prevents sleeping)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes with specific rate limiting
app.use('/api/auth', rateLimiters.auth, userRateLimit, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', rateLimiters.search, skillRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/matching', rateLimiters.search, matchingRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/admin', rateLimiters.admin, adminRoutes);

// Security error handling middleware
app.use(securityErrorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔒 Security middleware active`);
  console.log(`📊 Rate limiting enabled`);
  console.log(`🛡️  Input sanitization active`);
  console.log(`✅ All security measures initialized`);
  console.log('');
});
