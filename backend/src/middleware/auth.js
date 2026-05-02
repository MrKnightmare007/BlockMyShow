import jwt from 'jsonwebtoken';
import * as authUtils from '../utils/auth-utils.js';

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
    req.user.role = authUtils.extractRoleFromJWT(user);
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
    req.user.role = authUtils.extractRoleFromJWT(user);
    next();
  });
};

/**
 * Admin Role Check Middleware
 * Ensures user is an admin based on JWT role
 * Must be used after authenticateToken
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'This endpoint requires admin privileges',
    });
  }
  next();
};

/**
 * Role-Based Access Control Middleware
 * @param {array} allowedRoles - Array of roles that have access
 * @returns {function} Middleware function
 */
export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const userRole = req.user.role || 'user';
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This endpoint requires one of these roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Permission Check Middleware
 * @param {array} requiredPermissions - Array of required permissions
 * @returns {function} Middleware function
 */
export const requirePermission = (requiredPermissions = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const userRole = req.user.role || 'user';
    const hasPermission = authUtils.hasPermission(userRole, requiredPermissions);

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This endpoint requires one of these permissions: ${requiredPermissions.join(', ')}`,
      });
    }

    next();
  };
};

export default {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireRole,
  requirePermission,
};
