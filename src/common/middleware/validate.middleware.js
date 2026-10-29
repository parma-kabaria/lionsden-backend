import { ValidationError } from '../errors/app.error.js';

/**
 * Zod validation middleware factory
 * @param {{ body?: import('zod').ZodTypeAny, query?: import('zod').ZodTypeAny, params?: import('zod').ZodTypeAny }} schemas
 */
export const validate = schemas => async (req, res, next) => {
  try {
    if (schemas.body) {
      req.body = await schemas.body.parseAsync(req.body);
    }
    if (schemas.query) {
      const parsedQuery = await schemas.query.parseAsync(req.query);
      Object.defineProperty(req, 'query', {
        value: parsedQuery,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
    if (schemas.params) {
      const parsedParams = await schemas.params.parseAsync(req.params);
      Object.defineProperty(req, 'params', {
        value: parsedParams,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
    next();
  } catch (error) {
    if (error.errors && Array.isArray(error.errors)) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return next(new ValidationError('Request validation failed', formattedErrors));
    }
    next(error);
  }
};
