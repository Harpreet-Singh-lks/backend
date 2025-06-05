const Joi = require('joi');

// Chapter validation schema
const chapterSchema = Joi.object({
  title: Joi.string().trim().max(200).required(),
  class: Joi.string().valid('6', '7', '8', '9', '10', '11', '12').required(),
  unit: Joi.number().integer().min(1).max(20).required(),
  subject: Joi.string().valid(
    'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 
    'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 
    'Economics', 'Political Science'
  ).required(),
  status: Joi.string().valid('completed', 'in-progress', 'not-started', 'under-review').optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
  weakChapters: Joi.boolean().optional(),
  description: Joi.string().trim().max(1000).optional(),
  topics: Joi.array().items(Joi.string().trim()).optional(),
  estimatedDuration: Joi.number().integer().min(1).max(600).optional(),
  completionPercentage: Joi.number().min(0).max(100).optional(),
  metadata: Joi.object({
    totalQuestions: Joi.number().integer().min(0).optional(),
    correctAnswers: Joi.number().integer().min(0).optional(),
    averageScore: Joi.number().min(0).max(100).optional()
  }).optional()
});

// User registration validation schema
const userRegistrationSchema = Joi.object({
  name: Joi.string().trim().max(50).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'teacher', 'student').optional(),
  profile: Joi.object({
    class: Joi.string().valid('6', '7', '8', '9', '10', '11', '12').optional(),
    subjects: Joi.array().items(Joi.string().valid(
      'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 
      'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 
      'Economics', 'Political Science'
    )).optional(),
    school: Joi.string().trim().optional()
  }).optional()
});

// User login validation schema
const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Query filters validation schema
const chapterFiltersSchema = Joi.object({
  class: Joi.string().valid('6', '7', '8', '9', '10', '11', '12').optional(),
  unit: Joi.number().integer().min(1).max(20).optional(),
  status: Joi.string().valid('completed', 'in-progress', 'not-started', 'under-review').optional(),
  subject: Joi.string().valid(
    'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 
    'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 
    'Economics', 'Political Science'
  ).optional(),
  weakChapters: Joi.string().valid('true', 'false').optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
  search: Joi.string().trim().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid('title', 'class', 'unit', 'status', 'createdAt', '-title', '-class', '-unit', '-status', '-createdAt').optional()
});

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: errorMessage
      });
    }
    
    req[property] = value;
    next();
  };
};

// File validation for chapter upload
const validateChapterFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      status: 'error',
      message: 'No file uploaded'
    });
  }
  
  if (req.file.mimetype !== 'application/json') {
    return res.status(400).json({
      status: 'error',
      message: 'File must be a JSON file'
    });
  }
  
  try {
    const chaptersData = JSON.parse(req.file.buffer.toString());
    
    if (!Array.isArray(chaptersData)) {
      return res.status(400).json({
        status: 'error',
        message: 'JSON file must contain an array of chapters'
      });
    }
    
    req.chaptersData = chaptersData;
    next();
  } catch (error) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid JSON file format'
    });
  }
};

module.exports = {
  validate,
  validateChapterFile,
  schemas: {
    chapter: chapterSchema,
    userRegistration: userRegistrationSchema,
    userLogin: userLoginSchema,
    chapterFilters: chapterFiltersSchema
  }
};