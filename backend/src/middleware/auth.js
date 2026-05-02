import jwt from 'jsonwebtoken';

/**
 * Authentication Middleware
 * Verifies JWT token from Authorization header
 * Attaches user object to req.user on success
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No authentication token provided',
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      console.error('[AUTH] Token verification failed:', err.message);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid or expired token',
      });
    }

    req.user = user;
    next();
  });
};

/**
 * Optional Authentication Middleware
 * Verifies JWT token if provided, but doesn't require it
 * Useful for endpoints that should work both authenticated and anonymous
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // Continue without user
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      console.log('[AUTH] Optional authentication failed (continuing):', err.message);
      return next(); // Continue even if token is invalid
    }

    req.user = user;
    next();
  });
};

/**
 * Role-based Authorization Middleware
 * Checks if user has required role(s)
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        userRole: req.user.role,
      });
    }

    next();
  };
};

/**
 * Admin Check Middleware
 * Verifies user is admin
 */
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Only admins can perform this action',
    });
  }

  next();
};

/**
 * Rate Limiting Helper
 * Implement basic rate limiting (in production, use redis-based solution)
 */
const rateLimitStore = new Map();

export const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const userRequests = rateLimitStore.get(key) || [];

    // Remove old requests outside the window
    const recentRequests = userRequests.filter((t) => now - t < windowMs);

    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds`,
      });
    }

    recentRequests.push(now);
    rateLimitStore.set(key, recentRequests);

    next();
  };
};

export default authenticateToken;
