import { Request, Response, NextFunction } from 'express';
import { config } from '../config/variables.config';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
  isPublic: boolean;

  constructor(message: string, statusCode: number, isPublic: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.isPublic = isPublic;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Not authorized to perform this action') {
    super(message, 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, true);
  }
}

const formatZodError = (err: ZodError) => {
  return err.errors.map((e) => ({
    path: e.path.join('.'),
    message: e.message,
  }));
};

const formatMongooseError = (err: mongoose.Error) => {
  if (err instanceof mongoose.Error.ValidationError) {
    return Object.values(err.errors).map((e) => ({
      path: e.path,
      message: e.message,
    }));
  }
  if (err instanceof mongoose.Error.CastError) {
    return [{
      path: err.path,
      message: `Invalid ${err.path}`,
    }];
  }
  return [{ message: 'Invalid data format' }];
};

const sanitizeError = (err: Error | AppError): { message: string; errors?: any[] } => {
  // For known operational errors, return sanitized message
  if (err instanceof AppError) {
    if (err.isPublic) {
      return {
        message: err.message,
      };
    }
    // For non-public errors, return generic message
    return {
      message: 'An error occurred',
    };
  }

  // For validation errors, return sanitized validation messages
  if (err instanceof ZodError) {
    return {
      message: 'Validation failed',
      errors: formatZodError(err),
    };
  }

  if (err instanceof mongoose.Error) {
    return {
      message: 'Invalid data format',
      errors: formatMongooseError(err),
    };
  }

  // For unknown errors, return generic message
  return {
    message: 'An unexpected error occurred',
  };
};

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Log the full error in development
  if (config.nodeEnv === 'development') {
    console.error('ERROR 💥', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...(err instanceof AppError && { statusCode: err.statusCode }),
    });
  } else {
    // In production, log minimal error info
    console.error('ERROR 💥', {
      name: err.name,
      message: err.message,
      ...(err instanceof AppError && { statusCode: err.statusCode }),
    });
  }

  // Get sanitized error response
  const sanitizedError = sanitizeError(err);

  // Determine status code
  let statusCode = 500;
  if (err instanceof AppError) {
    statusCode = err.statusCode;
  } else if (err instanceof ZodError || err instanceof mongoose.Error) {
    statusCode = 400;
  }

  // Send response
  return res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail',
    ...sanitizedError,
  });
};
