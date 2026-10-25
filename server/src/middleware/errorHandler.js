import { sendError } from '../utils/responseHandler.js';

export const errorHandler = (err, req, res, next) => {
  console.error('Unhandled API Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((el) => el.message);
    return sendError(res, {
      statusCode: 400,
      message: 'Validation failed',
      errors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, {
      statusCode: 409,
      message: `A record with this ${field} already exists.`,
    });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return sendError(res, {
      statusCode: 400,
      message: `Invalid ID format for ${err.path}: ${err.value}`,
    });
  }

  // Zod validation error
  if (err.name === 'ZodError') {
    const formatted = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    return sendError(res, {
      statusCode: 400,
      message: 'Request payload validation failed',
      errors: formatted,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return sendError(res, {
      statusCode: 401,
      message: 'Authentication token is invalid or expired.',
    });
  }

  // Default server error
  return sendError(res, {
    statusCode: err.statusCode || 500,
    message: err.message || 'Internal Server Error',
  });
};
