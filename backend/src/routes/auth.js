import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as authController from '../controllers/auth.js';

const router = express.Router();

/**
 * POST /auth/login
 * Login or register user with email and password
 * 
 * @body {string} email - User email address
 * @body {string} password - User password (will be bcrypted)
 * @body {string} [walletAddress] - Optional wallet address
 * @returns {object} { user, token, message }
 * 
 * @example
 * POST /api/v1/auth/login
 * {
 *   "email": "user@example.com",
 *   "password": "securePassword123"
 * }
 * 
 * Response:
 * {
 *   "user": {
 *     "id": "user_123",
 *     "email": "user@example.com",
 *     "role": "user"
 *   },
 *   "token": "eyJhbGciOiJIUzI1NiIs...",
 *   "message": "Logged in successfully"
 * }
 */
router.post('/login', authController.login);

/**
 * POST /auth/logout
 * Logout user by invalidating token (client-side removal)
 * 
 * @auth Required - Bearer token
 * @returns {object} { message }
 * 
 * @example
 * POST /api/v1/auth/logout
 * Headers: Authorization: Bearer <token>
 * 
 * Response: { "message": "Logged out successfully" }
 */
router.post('/logout', authenticateToken, authController.logout);

/**
 * GET /auth/wallet
 * Get or generate user's Web3 wallet
 * 
 * @auth Required - Bearer token
 * @returns {object} { walletAddress, publicKey }
 * 
 * @example
 * GET /api/v1/auth/wallet
 * Headers: Authorization: Bearer <token>
 * 
 * Response: { "walletAddress": "0x123...", "publicKey": "..." }
 */
router.get('/wallet', authenticateToken, authController.getWallet);

/**
 * GET /auth/profile
 * Get authenticated user's profile
 * 
 * @auth Required - Bearer token
 * @returns {object} { user }
 * 
 * @example
 * GET /api/v1/auth/profile
 * Headers: Authorization: Bearer <token>
 * 
 * Response: {
 *   "user": {
 *     "id": "user_123",
 *     "email": "user@example.com",
 *     "walletAddress": "0x123...",
 *     "role": "user",
 *     "createdAt": "2024-01-15T10:30:00Z"
 *   }
 * }
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * PUT /auth/profile
 * Update user profile
 * 
 * @auth Required - Bearer token
 * @body {string} [name] - User's full name
 * @body {string} [phone] - User's phone number
 * @body {string} [avatar] - Avatar URL
 * @returns {object} { user, message }
 * 
 * @example
 * PUT /api/v1/auth/profile
 * Headers: Authorization: Bearer <token>
 * {
 *   "name": "John Doe",
 *   "phone": "+91-9999-999999"
 * }
 * 
 * Response: { "user": {...}, "message": "Profile updated" }
 */
router.put('/profile', authenticateToken, authController.updateProfile);

/**
 * POST /auth/refresh-token
 * Refresh JWT token
 * 
 * @auth Required - Bearer token
 * @body {string} token - Current token to refresh
 * @returns {object} { token, expiresIn }
 * 
 * @example
 * POST /api/v1/auth/refresh-token
 * Headers: Authorization: Bearer <token>
 * 
 * Response: { "token": "eyJhbGciOiJIUzI1NiIs...", "expiresIn": "7d" }
 */
router.post('/refresh-token', authenticateToken, authController.refreshToken);

export default router;
