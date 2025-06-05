const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

// Apply auth rate limiter to all auth routes
router.use(authLimiter);

// POST /api/v1/auth/register
router.post('/register', 
  validate(schemas.userRegistration),
  authController.register
);

// POST /api/v1/auth/login
router.post('/login',
  validate(schemas.userLogin),
  authController.login
);

// GET /api/v1/auth/profile
router.get('/profile',
  authenticate,
  authController.getProfile
);

// PUT /api/v1/auth/profile
router.put('/profile',
  authenticate,
  authController.updateProfile
);

// POST /api/v1/auth/logout
router.post('/logout',
  authenticate,
  authController.logout
);

module.exports = router;