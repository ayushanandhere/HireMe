const rateLimit = require('express-rate-limit');

const authRateLimitEnabled =
  process.env.NODE_ENV === 'production' || process.env.AUTH_RATE_LIMIT_ENABLED === 'true';

const passthroughLimiter = (_req, _res, next) => next();

const createAuthLimiter = ({ windowMs, max }) => {
  if (!authRateLimitEnabled) {
    return passthroughLimiter;
  }

  return rateLimit({
    windowMs,
    max,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many authentication attempts. Please try again later.',
    },
  });
};

const loginLimiter = createAuthLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
});

const registrationLimiter = createAuthLimiter({
  windowMs: 60 * 60 * 1000,
  max: 8,
});

const passwordResetLimiter = createAuthLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
});

const googleCredentialLimiter = createAuthLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
});

module.exports = {
  googleCredentialLimiter,
  loginLimiter,
  passwordResetLimiter,
  registrationLimiter,
};
