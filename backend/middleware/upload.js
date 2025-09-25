const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Ensure uploads directory exists
const ensureUploadsDir = async () => {
  try {
    await fs.access('uploads');
  } catch (error) {
    // Directory doesn't exist, create it
    await fs.mkdir('uploads', { recursive: true });
  }
};

// Initialize uploads directory on module load
ensureUploadsDir().catch(console.error);

// Configure multer storage
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      // Ensure uploads directory exists before saving
      await ensureUploadsDir();
      cb(null, 'uploads/');
    } catch (error) {
      cb(error, 'uploads/');
    }
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + extension;
    cb(null, filename);
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Helper function to clean up old avatar files
const cleanupOldAvatar = async (oldAvatarPath) => {
  if (!oldAvatarPath) return;
  
  try {
    // If it's a full path, extract just the filename
    const filename = path.basename(oldAvatarPath);
    const fullPath = path.join('uploads', filename);
    
    // Check if file exists before trying to delete
    try {
      await fs.access(fullPath);
      await fs.unlink(fullPath);
      console.log('Successfully deleted old avatar:', fullPath);
    } catch (error) {
      // File doesn't exist, which is fine
      console.log('Old avatar file not found for deletion:', fullPath);
    }
  } catch (error) {
    console.error('Error cleaning up old avatar:', error);
  }
};

module.exports = {
  upload,
  cleanupOldAvatar
};