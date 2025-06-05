const multer = require('multer');
const path = require('path');
const config = require('../config/config');

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store in memory for JSON parsing

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype === 'application/json') {
    cb(null, true);
  } else {
    cb(new Error('Only JSON files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize
  }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    
    return res.status(400).json({
      status: 'error',
      message: 'File upload error: ' + err.message
    });
  }
  
  if (err) {
    return res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
  
  next();
};

module.exports = {
  upload,
  handleMulterError
};