import { AppError } from '../errors/app.error.js';
import { ERROR_CODES } from '../errors/error-codes.js';
import { logger } from '../../config/logger.js';
import { config } from '../../config/index.js';

export const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.errorCode || ERROR_CODES.INTERNAL_SERVER_ERROR;
  let details = err.details || null;

  // Handle custom AppError (including Zod validation errors)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.errorCode;
    details = err.details;
    if (Array.isArray(details) && details.length > 0 && details[0].message) {
      message = details.map(d => d.message).join('. ');
    }
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field '${err.path}'`;
    errorCode = ERROR_CODES.BAD_REQUEST;
  } else if (err.code === 11000) {
    statusCode = 409;
    const duplicatedField = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with this ${duplicatedField} already exists`;
    errorCode = ERROR_CODES.CONFLICT;
    details = err.keyValue;
  } else if (err.name === 'ValidationError') {
    // Mongoose schema validation error
    statusCode = 422;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    details = Object.values(err.errors || {}).map(e => ({
      field: e.path,
      message: e.message,
    }));
    message = details.length > 0 ? details.map(d => d.message).join('. ') : 'Database validation failed';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    errorCode = ERROR_CODES.UNAUTHORIZED;
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
    errorCode = ERROR_CODES.UNAUTHORIZED;
  }

  // Log error with context
  if (statusCode >= 500) {
    logger.error(
      {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        statusCode,
        err: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
      },
      'Unhandled internal server error'
    );
  } else {
    logger.warn(
      {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        statusCode,
        errorCode,
        message,
      },
      'Client operational error'
    );
  }

  const response = {
    success: false,
    message,
    error: {
      code: errorCode,
      ...(details ? { details } : {}),
      ...(config.isDevelopment && statusCode >= 500 ? { stack: err.stack } : {}),
    },
  };

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req, res, next) => {
  next(
    new AppError(`Resource not found: ${req.method} ${req.originalUrl}`, 404, ERROR_CODES.NOT_FOUND)
  );
};
