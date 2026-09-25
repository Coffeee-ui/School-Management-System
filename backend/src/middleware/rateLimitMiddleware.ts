import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 login/register requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please slow down',
  },
});
