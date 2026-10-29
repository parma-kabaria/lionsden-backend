import { ERROR_CODES } from './error-codes.js';

export class AppError extends Error {
  constructor(
    message,
    statusCode = 500,
    errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR,
    details = null
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details = null, errorCode = ERROR_CODES.BAD_REQUEST) {
    super(message, 400, errorCode, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation Failed', details = null) {
    super(message, 422, ERROR_CODES.VALIDATION_ERROR, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', details = null) {
    super(message, 401, ERROR_CODES.UNAUTHORIZED, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action', details = null) {
    super(message, 403, ERROR_CODES.FORBIDDEN, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = null) {
    super(message, 404, ERROR_CODES.NOT_FOUND, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details = null, errorCode = ERROR_CODES.CONFLICT) {
    super(message, 409, errorCode, details);
  }
}
