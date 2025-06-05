const redisClient = require('../utils/redis');
const config = require('../config/config');

// Generate cache key from request
const generateCacheKey = (req) => {
  const baseKey = `${config.cache.prefix}${req.route.path}`;
  const queryString = JSON.stringify(req.query);
  const userContext = req.user ? `user:${req.user.id}` : 'anonymous';
  
  return `${baseKey}:${userContext}:${Buffer.from(queryString).toString('base64')}`;
};

// Cache middleware
const cache = (ttl = config.cache.ttl) => {
  return async (req, res, next) => {
    // Skip caching if Redis is not available
    if (!redisClient.isClientConnected()) {
      return next();
    }

    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const cacheKey = generateCacheKey(req);
      const cachedData = await redisClient.getClient().get(cacheKey);

      if (cachedData) {
        const data = JSON.parse(cachedData);
        return res.json({
          ...data,
          cached: true,
          cacheTimestamp: new Date().toISOString()
        });
      }

      // Store original res.json
      const originalJson = res.json;

      // Override res.json to cache the response
      res.json = function(data) {
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient.getClient().setEx(cacheKey, ttl, JSON.stringify(data))
            .catch(err => console.error('Cache set error:', err));
        }

        // Call original res.json
        originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Cache invalidation utility
const invalidateCache = async (pattern) => {
  if (!redisClient.isClientConnected()) {
    return;
  }

  try {
    const keys = await redisClient.getClient().keys(`${config.cache.prefix}${pattern}`);
    
    if (keys.length > 0) {
      await redisClient.getClient().del(keys);
      console.log(`Cache invalidated: ${keys.length} keys deleted`);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};

// Specific cache invalidation functions
const invalidateChapterCache = () => invalidateCache('*chapters*');
const invalidateUserCache = (userId) => invalidateCache(`*user:${userId}*`);

module.exports = {
  cache,
  invalidateCache,
  invalidateChapterCache,
  invalidateUserCache,
  generateCacheKey
};