const express = require('express');
const authRoutes = require('./auth');
const chapterRoutes = require('./chapters');

const router = express.Router();

// API Documentation endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Chapter Performance Dashboard API v1',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        profile: 'GET /api/v1/auth/profile',
        updateProfile: 'PUT /api/v1/auth/profile',
        logout: 'POST /api/v1/auth/logout'
      },
      chapters: {
        getAll: 'GET /api/v1/chapters',
        getById: 'GET /api/v1/chapters/:id',
        create: 'POST /api/v1/chapters',
        upload: 'POST /api/v1/chapters/upload',
        update: 'PUT /api/v1/chapters/:id',
        delete: 'DELETE /api/v1/chapters/:id'
      }
    },
    filters: {
      chapters: {
        class: '6, 7, 8, 9, 10, 11, 12',
        unit: '1-20',
        status: 'completed, in-progress, not-started, under-review',
        subject: 'Mathematics, Science, English, etc.',
        weakChapters: 'true, false',
        difficulty: 'easy, medium, hard',
        search: 'text search in title and description'
      },
      pagination: {
        page: 'Page number (default: 1)',
        limit: 'Items per page (default: 10, max: 100)',
        sort: 'Sort field (default: -createdAt)'
      }
    }
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/chapters', chapterRoutes);

module.exports = router;