const rateLimit = require('express-rate-limit');

/**
 * Rate Limiting Configuration
 * Protects against brute force attacks and DDoS
 */

function isLocalRequest(req) {
  const ip = String(req.ip || req.connection?.remoteAddress || '');
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}

function shouldSkipRateLimit(req) {
  const env = String(process.env.NODE_ENV || 'development').toLowerCase();
  const bypassFlag = String(process.env.DISABLE_RATE_LIMIT || '').toLowerCase();
  if (bypassFlag === 'true' || bypassFlag === '1') return true;
  if (env !== 'production') return true;
  return isLocalRequest(req);
}

// Strict rate limit for auth endpoints (login, register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 attempts per IP
  message: 'Too many authentication attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
});

// Moderate rate limit for general API endpoints
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Max 30 requests per IP per minute
  message: 'Too many requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
});

// Strict rate limit for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 attempts per hour
  message: 'Too many password reset attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
});

// Very strict for brute force password attacks
const loginAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 login attempts
  skipSuccessfulRequests: true, // Don't count successful requests
  message: 'Too many failed login attempts. Account locked for 15 minutes.',
  skip: shouldSkipRateLimit,
});

module.exports = {
  authLimiter,
  apiLimiter,
  passwordResetLimiter,
  loginAttemptLimiter,
};
