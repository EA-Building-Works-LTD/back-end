/**
 * Error handling middleware for Express
 */

// Not Found middleware
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  // Set default status code
  const statusCode = err.status || err.statusCode || 500;
  
  // Log error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err);
  }
  
  // Prepare error response
  const errorResponse = {
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  };
  
  // Add validation errors if available
  if (err.errors) {
    errorResponse.errors = err.errors;
  }
  
  // Send error response
  res.status(statusCode).json(errorResponse);
};

// Request logger middleware (optional)
const requestLogger = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
};

// Rate limiter middleware (optional)
const rateLimit = (options = {}) => {
  const { windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests, please try again later.' } = options;
  
  const requests = new Map();
  
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    // Clean up old requests
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }
    
    const userRequests = requests.get(ip);
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    // Update requests
    requests.set(ip, [...validRequests, now]);
    
    if (validRequests.length >= max) {
      return res.status(429).json({ message });
    }
    
    next();
  };
};

module.exports = {
  notFound,
  errorHandler,
  requestLogger,
  rateLimit,
}; 