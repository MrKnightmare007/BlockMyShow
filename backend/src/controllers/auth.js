import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import * as authUtils from '../utils/auth-utils.js';
import { sendOTPEmail, sendWelcomeEmail, sendAdminWelcomeEmail } from '../utils/email.js';

/**
 * OTP Store for Email Verification
 * In production, use Redis or Firestore
 */
const EMAIL_OTP_STORE = new Map();

/**
 * Authentication Controller - Multi-Method Auth
 * Supports: Email, Google OAuth, MetaMask
 * 
 * Flow:
 * 1. User signs up with email/password
 * 2. OTP sent to email for verification
 * 3. User verifies OTP
 * 4. Account fully activated, JWT token returned with wallet_address
 */

/**
 * ===========================
 * EMAIL OTP VERIFICATION
 * ===========================
 */

/**
 * POST /auth/send-email-otp
 * Send OTP to user's email
 */
export const sendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email is required',
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    EMAIL_OTP_STORE.set(email, {
      otp,
      expiresAt,
      attempts: 0,
    });

    console.log(`[AUTH] OTP sent to ${email}: ${otp}`);

    // Send OTP email
    try {
      await sendOTPEmail(email, otp);
    } catch (emailError) {
      console.error('Warning: Failed to send OTP email:', emailError.message);
    }

    res.json({
      success: true,
      email,
      message: 'OTP sent to email',
      expiresIn: 600, // seconds
    });
  } catch (error) {
    console.error('[AUTH/SEND-EMAIL-OTP]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * POST /auth/verify-email-otp
 * Verify OTP and complete email signup
 */
export const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp, password, name } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email, OTP, and password are required',
      });
    }

    // Check if OTP exists
    const storedOTP = EMAIL_OTP_STORE.get(email);
    if (!storedOTP) {
      return res.status(400).json({
        error: 'Invalid OTP',
        message: 'OTP not found. Request a new OTP.',
      });
    }

    // Check if OTP expired
    if (Date.now() > storedOTP.expiresAt) {
      EMAIL_OTP_STORE.delete(email);
      return res.status(400).json({
        error: 'OTP Expired',
        message: 'OTP has expired. Request a new OTP.',
      });
    }

    // Check attempts
    if (storedOTP.attempts >= 3) {
      EMAIL_OTP_STORE.delete(email);
      return res.status(400).json({
        error: 'Too Many Attempts',
        message: 'Maximum attempts exceeded. Request a new OTP.',
      });
    }

    // Verify OTP
    if (storedOTP.otp !== otp) {
      storedOTP.attempts++;
      return res.status(400).json({
        error: 'Invalid OTP',
        message: `Incorrect OTP. ${3 - storedOTP.attempts} attempts remaining.`,
      });
    }

    // OTP verified! Create the account
    const wallet = authUtils.generateWallet();
    const passwordHash = authUtils.hashPassword(password);

    const user = {
      id: `user_${Date.now()}`,
      email,
      passwordHash,
      walletAddress: wallet.address,
      publicAddress: wallet.address,
      auth_method: 'email',
      role: 'user',
      verified: true, // Email verified
      profile: {
        name: name || null,
        avatar: null,
        phone: null,
      },
      createdAt: new Date(),
    };

    // Clean up OTP
    EMAIL_OTP_STORE.delete(email);

    // Create JWT
    const token = authUtils.createJWT({
      id: user.id,
      email: user.email,
      walletAddress: user.walletAddress,
      role: user.role,
      auth_method: 'email',
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(email, name || email);
    } catch (emailError) {
      console.error('Warning: Failed to send welcome email:', emailError.message);
    }

    res.status(201).json({
      success: true,
      user: authUtils.sanitizeUserResponse(user),
      token,
      walletAddress: wallet.address,
      message: 'Email verified! Account created successfully.',
    });
  } catch (error) {
    console.error('[AUTH/VERIFY-EMAIL-OTP]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * ===========================
 * EMAIL AUTHENTICATION
 * ===========================
 */

/**
 * POST /auth/signup/email
 * Register new user with email and password
 * Generates wallet address but not private key
 */
export const signupEmail = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required',
      });
    }

    // TODO: Check if user exists in DB
    // For now, create mock user
    const wallet = authUtils.generateWallet();
    const passwordHash = authUtils.hashPassword(password);
    const privateKeyHash = authUtils.hashPrivateKey(wallet.privateKey);

    const user = {
      id: `user_${Date.now()}`,
      email,
      passwordHash,
      walletAddress: wallet.address,
      publicAddress: wallet.address,
      auth_method: 'email',
      role: 'user',
      profile: {
        name: name || null,
        avatar: null,
        phone: null,
      },
      createdAt: new Date(),
    };

    // Store wallet info in session/DB (NOT private key)
    const token = authUtils.createJWT({
      id: user.id,
      email: user.email,
      walletAddress: user.walletAddress,
      role: user.role,
      auth_method: 'email',
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(email, name || email);
    } catch (emailError) {
      console.error('Warning: Failed to send welcome email:', emailError.message);
      // Don't fail the signup if email fails
    }

    res.status(201).json({
      success: true,
      user: authUtils.sanitizeUserResponse(user),
      token,
      walletAddress: wallet.address,
      message: 'Email signup successful. Welcome email sent. Call /wallet-keypair to get private key.',
    });
  } catch (error) {
    console.error('[AUTH/SIGNUP-EMAIL]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * POST /auth/login/email
 * Login with email and password
 */
export const loginEmail = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required',
      });
    }

    // TODO: Verify user in DB, check password
    // For now, mock auth
    const user = {
      id: `user_${Date.now()}`,
      email,
      walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      auth_method: 'email',
      role: 'user',
      createdAt: new Date(),
    };

    const token = authUtils.createJWT({
      id: user.id,
      email: user.email,
      walletAddress: user.walletAddress,
      role: user.role,
      auth_method: 'email',
    });

    res.status(200).json({
      success: true,
      user: authUtils.sanitizeUserResponse(user),
      token,
      walletAddress: user.walletAddress,
      message: 'Email login successful',
    });
  } catch (error) {
    console.error('[AUTH/LOGIN-EMAIL]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * ===========================
 * GOOGLE OAUTH AUTHENTICATION
 * ===========================
 */

/**
 * POST /auth/signup/google
 * Register/Login with Google OAuth token
 */
export const signupGoogle = async (req, res) => {
  try {
    const { googleToken, idToken } = req.body;

    if (!googleToken && !idToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Google token or idToken is required',
      });
    }

    // TODO: Verify token with Google API / Firebase
    // const decodedToken = await admin.auth().verifyIdToken(idToken);
    // const { email, name } = decodedToken;

    const email = 'user@google.com'; // Mock
    const name = 'Google User'; // Mock

    // Check if user exists, create if not
    const wallet = authUtils.generateWallet();

    const user = {
      id: `user_${Date.now()}`,
      email,
      walletAddress: wallet.address,
      publicAddress: wallet.address,
      auth_method: 'google',
      role: 'user',
      profile: {
        name,
        avatar: null,
        phone: null,
      },
      oauth: {
        googleId: googleToken || idToken,
        googleEmail: email,
      },
      createdAt: new Date(),
    };

    const token = authUtils.createJWT({
      id: user.id,
      email: user.email,
      walletAddress: user.walletAddress,
      role: user.role,
      auth_method: 'google',
    });

    res.status(201).json({
      success: true,
      user: authUtils.sanitizeUserResponse(user),
      token,
      walletAddress: wallet.address,
      message: 'Google signup successful. Call /wallet-keypair to get private key.',
    });
  } catch (error) {
    console.error('[AUTH/SIGNUP-GOOGLE]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * POST /auth/login/google
 * Login with Google OAuth token
 */
export const loginGoogle = async (req, res) => {
  try {
    const { googleToken, idToken } = req.body;

    if (!googleToken && !idToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Google token or idToken is required',
      });
    }

    // TODO: Verify token with Google / Firebase
    const email = 'user@google.com'; // Mock

    const user = {
      id: `user_${Date.now()}`,
      email,
      walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      auth_method: 'google',
      role: 'user',
      createdAt: new Date(),
    };

    const token = authUtils.createJWT({
      id: user.id,
      email: user.email,
      walletAddress: user.walletAddress,
      role: user.role,
      auth_method: 'google',
    });

    res.status(200).json({
      success: true,
      user: authUtils.sanitizeUserResponse(user),
      token,
      walletAddress: user.walletAddress,
      message: 'Google login successful',
    });
  } catch (error) {
    console.error('[AUTH/LOGIN-GOOGLE]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * ===========================
 * METAMASK AUTHENTICATION
 * ===========================
 */

/**
 * POST /auth/signup/metamask
 * Register with MetaMask wallet
 * User should send connected wallet address and signature
 */
export const signupMetamask = async (req, res) => {
  try {
    const { address, signature, message } = req.body;

    if (!address || !signature) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'MetaMask address and signature are required',
      });
    }

    // Verify signature (optional, for security)
    // const isValid = authUtils.verifyEthereumSignature(message, signature, address);
    // if (!isValid) return res.status(401).json({ error: 'Invalid signature' });

    // Use MetaMask wallet as user's wallet address
    const wallet = {
      address: address.toLowerCase(),
      privateKey: null, // No private key for MetaMask (user owns it)
    };

    const user = {
      id: `user_${Date.now()}`,
      email: null,
      walletAddress: wallet.address,
      publicAddress: wallet.address,
      auth_method: 'metamask',
      role: 'user',
      profile: {
        name: null,
        avatar: null,
        phone: null,
      },
      oauth: {
        metamaskAddress: address.toLowerCase(),
      },
      createdAt: new Date(),
    };

    const token = authUtils.createJWT({
      id: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
      auth_method: 'metamask',
    });

    res.status(201).json({
      success: true,
      user: authUtils.sanitizeUserResponse(user),
      token,
      walletAddress: wallet.address,
      message: 'MetaMask signup successful',
    });
  } catch (error) {
    console.error('[AUTH/SIGNUP-METAMASK]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * POST /auth/login/metamask
 * Login with MetaMask wallet
 */
export const loginMetamask = async (req, res) => {
  try {
    const { address, signature, message } = req.body;

    if (!address) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'MetaMask address is required',
      });
    }

    // TODO: Verify signature in production
    // const isValid = authUtils.verifyEthereumSignature(message, signature, address);

    const user = {
      id: `user_${Date.now()}`,
      walletAddress: address.toLowerCase(),
      auth_method: 'metamask',
      role: 'user',
      createdAt: new Date(),
    };

    const token = authUtils.createJWT({
      id: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
      auth_method: 'metamask',
    });

    res.status(200).json({
      success: true,
      user: authUtils.sanitizeUserResponse(user),
      token,
      walletAddress: user.walletAddress,
      message: 'MetaMask login successful',
    });
  } catch (error) {
    console.error('[AUTH/LOGIN-METAMASK]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * ===========================
 * WALLET KEYPAIR GENERATION
 * ===========================
 */

/**
 * POST /auth/wallet-keypair
 * Generate/retrieve wallet keypair for user (one-time return of private key)
 * 
 * Used after signup with email/google
 * MetaMask users don't need this (they own their private key)
 */
export const generateWalletKeypair = async (req, res) => {
  try {
    const userId = req.user.id;
    const authMethod = req.user.auth_method;

    // MetaMask users don't get a generated private key
    if (authMethod === 'metamask') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'MetaMask users manage their own private keys',
      });
    }

    // TODO: Check if wallet already exists in DB for this user
    // For now, generate new wallet
    const wallet = authUtils.generateWallet();

    // Return private key only once
    // TODO: Mark in DB that private key was returned to prevent re-access
    res.status(200).json({
      success: true,
      publicAddress: wallet.address,
      privateKey: wallet.privateKey,
      chainId: parseInt(process.env.CHAIN_ID || '84532'),
      network: process.env.BLOCKCHAIN_NETWORK || 'baseSepolia',
      warning: '⚠️ IMPORTANT: Store private key securely. It will not be shown again.',
      message: 'Wallet keypair generated. Save the private key securely.',
    });
  } catch (error) {
    console.error('[AUTH/WALLET-KEYPAIR]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * ===========================
 * ADMIN AUTHENTICATION
 * ===========================
 */

/**
 * POST /auth/admin-signup
 * Create new admin user (protected endpoint)
 */
export const adminSignup = async (req, res) => {
  try {
    // TODO: Verify that request comes from existing admin
    const { username, password, email, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Admin username and password are required',
      });
    }

    const validRoles = ['admin', 'event_creator', 'gate_operator'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Role must be one of: ${validRoles.join(', ')}`,
      });
    }

    // TODO: Check if username exists in admin collection
    const passwordHash = authUtils.hashPassword(password);

    const admin = {
      id: `admin_${Date.now()}`,
      username,
      passwordHash,
      email: email || null,
      role: role || 'admin',
      accountStatus: 'active',
      createdAt: new Date(),
    };

    const token = authUtils.createJWT({
      id: admin.id,
      username: admin.username,
      role: admin.role,
      isAdmin: true,
    });

    res.status(201).json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
      token,
      message: 'Admin user created successfully',
    });
  } catch (error) {
    console.error('[AUTH/ADMIN-SIGNUP]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * POST /auth/admin-login
 * Admin login with username and password
 */
export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Admin username and password are required',
      });
    }

    // TODO: Look up admin in DB, verify password
    // Mock admin for now
    const adminId = `admin_${Date.now()}`;
    const passwordHash = authUtils.hashPassword(password);

    const admin = {
      id: adminId,
      username,
      role: 'admin',
      accountStatus: 'active',
    };

    const token = authUtils.createJWT({
      id: admin.id,
      username: admin.username,
      role: admin.role,
      isAdmin: true,
    });

    res.status(200).json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
      },
      token,
      message: 'Admin login successful',
    });
  } catch (error) {
    console.error('[AUTH/ADMIN-LOGIN]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * ===========================
 * UTILITY ENDPOINTS
 * ===========================
 */

/**
 * POST /auth/logout
 * Logout user (client-side token removal)
 */
export const logout = async (req, res) => {
  try {
    // Token invalidation happens client-side
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('[AUTH/LOGOUT]', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * POST /auth/refresh-token
 * Refresh JWT token
 */
export const refreshToken = async (req, res) => {
  try {
    const newToken = authUtils.createJWT({
      id: req.user.id,
      email: req.user.email || null,
      walletAddress: req.user.walletAddress,
      role: req.user.role,
      auth_method: req.user.auth_method,
    });

    res.json({
      success: true,
      token: newToken,
      expiresIn: process.env.JWT_EXPIRY || '7d',
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    console.error('[AUTH/REFRESH]', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
};

/**
 * GET /auth/profile
 * Get authenticated user profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = {
      id: req.user.id,
      email: req.user.email || null,
      walletAddress: req.user.walletAddress,
      role: req.user.role,
      auth_method: req.user.auth_method,
    };

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('[AUTH/PROFILE]', error);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
};

export default {
  // Email auth
  signupEmail,
  loginEmail,
  // Google auth
  signupGoogle,
  loginGoogle,
  // MetaMask auth
  signupMetamask,
  loginMetamask,
  // Wallet & Keypair
  generateWalletKeypair,
  // Admin auth
  adminSignup,
  adminLogin,
  // Utilities
  logout,
  refreshToken,
  getProfile,
};
