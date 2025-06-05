const express = require('express');
const chapterController = require('../controllers/chapterController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { apiLimiter, uploadLimiter } = require('../middleware/rateLimiter');
const { cache } = require('../middleware/cache');
const { validate, validateChapterFile, schemas } = require('../middleware/validation');
const { upload, handleMulterError } = require('../utils/fileParser');

const router = express.Router();

// Apply general rate limiter to all chapter routes
router.use(apiLimiter);

// GET /api/v1/chapters - Get all chapters with filtering and pagination
router.get('/',
  validate(schemas.chapterFilters, 'query'),
  cache(3600), // Cache for 1 hour
  chapterController.getChapters
);

// GET /api/v1/chapters/:id - Get single chapter
router.get('/:id',
  cache(3600), // Cache for 1 hour
  chapterController.getChapterById
);

// POST /api/v1/chapters - Create single chapter (admin only)
router.post('/',
  authenticate,
  requireAdmin,
  validate(schemas.chapter),
  chapterController.createChapter
);

// POST /api/v1/chapters/upload - Bulk upload chapters from JSON file (admin only)
router.post('/upload',
  authenticate,
  requireAdmin,
  uploadLimiter, // More restrictive rate limiting for uploads
  upload.single('file'),
  handleMulterError,
  validateChapterFile,
  chapterController.uploadChapters
);

// PUT /api/v1/chapters/:id - Update chapter (admin only)
router.put('/:id',
  authenticate,
  requireAdmin,
  validate(schemas.chapter),
  chapterController.updateChapter
);

// DELETE /api/v1/chapters/:id - Delete chapter (admin only)
router.delete('/:id',
  authenticate,
  requireAdmin,
  chapterController.deleteChapter
);

module.exports = router;