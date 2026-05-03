import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import crypto from 'crypto';

/**
 * Auth Utilities
 * Wallet generation, password hashing, JWT helpers
 */

/**
 * Generate a random Ethereum wallet
 * @returns {object} { address, privateKey }
 */
export const generateWallet = () => {
  try {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      publicAddress: wallet.address, // Alias
      privateKey: wallet.privateKey,
    };
  } catch (error) {
    throw new Error(`Failed to generate wallet: ${error.message}`);
  }
};

/**
 * Hash the private key (for storage)
 * NOT the private key itself, but a hash for verification
 * Return value should be stored in DB, never the private key
 * @param {string} privateKey
 * @returns {string} Hash of private key
 */
export const hashPrivateKey = (privateKey) => {
  return crypto.createHash('sha256').update(privateKey).digest('hex');
};

/**
 * Create JWT token with user info and role
 * @param {object} payload - { id, email, walletAddress, role, auth_method }
 * @param {object} options - { expiresIn, ... }
 * @returns {string} JWT token
 */
export const createJWT = (payload, options = {}) => {
  const defaults = {
    expiresIn: process.env.JWT_EXPIRY || '7d',
  };

  const jwtOptions = { ...defaults, ...options };

  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', jwtOptions);
};

/**
 * Verify JWT token
 * @param {string} token
 * @returns {object} Decoded token payload
 */
export const verifyJWT = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (error) {
    throw new Error(`JWT verification failed: ${error.message}`);
  }
};

/**
 * Mock password hashing (use bcrypt in production)
 * @param {string} password
 * @returns {string} Hashed password
 */
export const hashPassword = (password) => {
  // TODO: Use bcrypt in production
  // For now, using simple hash for development
  return crypto.createHash('sha256').update(password).digest('hex');
};

/**
 * Mock password comparison
 * @param {string} password - Plain password
 * @param {string} hash - Hashed password
 * @returns {boolean}
 */
export const comparePassword = (password, hash) => {
  // TODO: Use bcrypt compare in production
  return hashPassword(password) === hash;
};

/**
 * Generate OTP for identity verification
 * @returns {string} 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Verify Ethereum signature (for MetaMask auth)
 * @param {string} message - Original message
 * @param {string} signature - Signature from MetaMask
 * @param {string} address - Address that signed
 * @returns {boolean} Is signature valid?
 */
export const verifyEthereumSignature = (message, signature, address) => {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
};

/**
 * Create response object with user data (sensitive fields removed)
 * @param {object} user - Full user object from DB
 * @returns {object} Safe user object for response
 */
export const sanitizeUserResponse = (user) => {
  const { passwordHash, encryptedPrivateKey, ...safeUser } = user;
  return safeUser;
};

/**
 * Extract role from JWT payload
 * @param {object} tokenPayload - Decoded JWT
 * @returns {string} Role (user, admin, gate_operator, etc.)
 */
export const extractRoleFromJWT = (tokenPayload) => {
  return tokenPayload.role || 'user';
};

/**
 * Check if user role has required permission
 * @param {string} userRole - User role from JWT
 * @param {array} requiredPermissions - Array of required permissions
 * @returns {boolean}
 */
export const hasPermission = (userRole, requiredPermissions = []) => {
  const rolePermissions = {
    admin: ['create_event', 'update_event', 'delete_event', 'scan_gate', 'manage_users', 'manage_admins'],
    event_creator: ['create_event', 'update_event', 'delete_event'],
    gate_operator: ['scan_gate', 'verify_identity'],
    user: ['view_events', 'book_tickets'],
  };

  const userPermissions = rolePermissions[userRole] || [];
  return requiredPermissions.every(perm => userPermissions.includes(perm));
};

export default {
  generateWallet,
  hashPrivateKey,
  createJWT,
  verifyJWT,
  hashPassword,
  comparePassword,
  generateOTP,
  verifyEthereumSignature,
  sanitizeUserResponse,
  extractRoleFromJWT,
  hasPermission,
};
