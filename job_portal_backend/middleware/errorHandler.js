// middleware/errorHandler.js
// Global error handling middleware

const { logEvent } = require('../utils/systemLogger');

/**
 * Global error handler middleware
 * Catches all errors and sends formatted response
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  logEvent({
    req,
    action: 'api.error',
    category: 'system',
    severity: statusCode >= 500 ? 'error' : 'warning',
    message: `${req.method} ${req.originalUrl} failed with ${statusCode}`,
    metadata: {
      statusCode,
      errorName: err.name,
      errorMessage: message,
    },
  });

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
