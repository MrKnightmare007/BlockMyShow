import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as authController from '../controllers/auth.js';

const router = express.Router();

/**
 * ========================
 * EMAIL AUTHENTICATION
 * ========================
 */

/**
 * POST /auth/signup/email
 * Register new user with email and password
 * 
 * @body {string} email - User email
 * @body {string} password - Password
 * @body {string} [name] - Optional full name
 * @returns { user, token, walletAddress, message }
 */
router.post('/signup/email', authController.signupEmail);

/**
 * POST /auth/login/email
 * Login with email and password
 * 
 * @body {string} email - User email
 * @body {string} password - Password
 * @returns { user, token, walletAddress, message }
 */
router.post('/login/email', authController.loginEmail);

/**
 * ========================
 * GOOGLE OAUTH
 * ========================
 */

/**
 * POST /auth/signup/google
 * Register with Google OAuth
 * 
 * @body {string} googleToken - Google OAuth token
 * @body {string} [idToken] - Firebase ID token (preferred)
 * @returns { user, token, walletAddress, message }
 */
router.post('/signup/google', authController.signupGoogle);

/**
 * POST /auth/login/google
 * Login with Google OAuth
 * 
 * @body {string} googleToken - Google OAuth token
 * @body {string} [idToken] - Firebase ID token (preferred)
 * @returns { user, token, walletAddress, message }
 */
router.post('/login/google', authController.loginGoogle);

/**
 * ========================
 * METAMASK WALLET AUTH
 * ========================
 */

/**
 * POST /auth/signup/metamask
 * Register with MetaMask wallet
 * 
 * @body {string} address - MetaMask wallet address
 * @body {string} signature - Signature from MetaMask.personal_sign
 * @body {string} [message] - Message that was signed
 * @returns { user, token, walletAddress, message }
 */
router.post('/signup/metamask', authController.signupMetamask);

/**
 * POST /auth/login/metamask
 * Login with MetaMask wallet
 * 
 * @body {string} address - MetaMask wallet address
 * @body {string} [signature] - Signature from MetaMask (optional but recommended)
 * @body {string} [message] - Message that was signed
 * @returns { user, token, walletAddress, message }
 */
router.post('/login/metamask', authController.loginMetamask);

/**
 * ========================
 * WALLET KEYPAIR
 * ========================
 */

/**
 * POST /auth/wallet-keypair
 * Generate wallet keypair for user (one-time private key delivery)
 * Only for email/google users
 * MetaMask users keep their own private keys
 * 
 * @auth Required - Bearer token
 * @returns { publicAddress, privateKey, chainId, network, warning }
 */
router.post('/wallet-keypair', authenticateToken, authController.generateWalletKeypair);

/**
 * ========================
 * ADMIN AUTHENTICATION
 * ========================
 */

/**
 * POST /auth/admin-signup
 * Create new admin user
 * 
 * @body {string} username - Admin username
 * @body {string} password - Admin password
 * @body {string} [email] - Admin email
 * @body {string} [role] - Role (admin, event_creator, gate_operator)
 * @returns { admin, token, message }
 */
router.post('/admin-signup', authController.adminSignup);

/**
 * POST /auth/admin-login
 * Admin login
 * 
 * @body {string} username - Admin username
 * @body {string} password - Admin password
 * @returns { admin, token, message }
 */
router.post('/admin-login', authController.adminLogin);

/**
 * ========================
 * UTILITY ENDPOINTS
 * ========================
 */

/**
 * POST /auth/logout
 * Logout user
 * 
 * @auth Required - Bearer token
 * @returns { message }
 */
router.post('/logout', authenticateToken, authController.logout);

/**
 * POST /auth/refresh-token
 * Refresh JWT token
 * 
 * @auth Required - Bearer token
 * @returns { token, expiresIn, message }
 */
router.post('/refresh-token', authenticateToken, authController.refreshToken);

/**
 * GET /auth/profile
 * Get authenticated user profile
 * 
 * @auth Required - Bearer token
 * @returns { user }
 */
router.get('/profile', authenticateToken, authController.getProfile);

export default router;
