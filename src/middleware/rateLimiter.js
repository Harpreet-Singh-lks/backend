const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redisClient = require('../utils/redis');
const config = require('../config/config');

// Create rate limiter with Redis store
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
      status: 'error',
      message: config.rateLimit.message,
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    },
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?.id || req.ip;
    }
  };

  // Use Redis store if available
  if (redisClient.isClientConnected()) {
    defaultOptions.store = new RedisStore({
      sendCommand: (...args) => redisClient.getClient().sendCommand(args),
      prefix: 'rl:',
    });
  }

  return rateLimit({
    ...defaultOptions,
    ...options
  });
};

// General API rate limiter
const apiLimiter = createRateLimiter();

// Stricter rate limiter for auth endpoints
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    status: 'error',
    message: 'Too many authentication attempts. Please try again later.',
    retryAfter: 15 * 60
  }
});

// Upload rate limiter (more restrictive)
const uploadLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 uploads per minute
  message: {
    status: 'error',
    message: 'Too many upload attempts. Please try again later.',
    retryAfter: 60
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  createRateLimiter
};