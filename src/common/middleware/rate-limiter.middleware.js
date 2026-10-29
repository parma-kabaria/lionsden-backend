import rateLimit from 'express-rate-limit';
import { config } from '../../config/index.js';
import { ERROR_CODES } from '../errors/error-codes.js';

export const standardLimiter = rateLimit({
  windowMs: config.isDevelopment ? 60000 : config.rateLimit.windowMs,
  max: config.isDevelopment ? 5000 : config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
      error: {
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      },
    });
  },
});

export const loginLimiter = rateLimit({
  windowMs: config.isDevelopment ? 60000 : config.rateLimit.loginWindowMs,
  max: config.isDevelopment ? 100 : config.rateLimit.loginMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.',
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
    },
  },
});
