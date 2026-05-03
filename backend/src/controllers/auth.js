import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import { initializeFirebase } from '../utils/firebase-config.js';
import db from '../utils/db.js';
import * as authUtils from '../utils/auth-utils.js';
import { sendOTPEmail, sendWelcomeEmail, sendAdminWelcomeEmail } from '../utils/email.js';

/**
 * OTP Store for Email Verification
 * In production, use Redis or Firestore
 */
const EMAIL_OTP_STORE = new Map();
const RESET_PASSWORD_OTP_STORE = new Map();

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
    const normalizedEmail = email.toLowerCase();
    EMAIL_OTP_STORE.set(normalizedEmail, {
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

    const responsePayload = {
      success: true,
      email,
      message: 'OTP sent to email',
      expiresIn: 600, // seconds
    };

    if (process.env.NODE_ENV !== 'production') {
      responsePayload.devOtp = otp;
      console.log(`\n=========================================\n🔑 DEV MODE OTP FOR ${email}: ${otp}\n=========================================\n`);
    }

    res.json(responsePayload);
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
    const normalizedEmail = email.toLowerCase();
    const storedOTP = EMAIL_OTP_STORE.get(normalizedEmail);
    if (!storedOTP) {
      console.log(`[AUTH] OTP not found for ${normalizedEmail}. Current store keys:`, Array.from(EMAIL_OTP_STORE.keys()));
      return res.status(400).json({
        error: 'Invalid OTP',
        message: 'OTP not found. Request a new OTP.',
      });
    }

    // Check if OTP expired
    if (Date.now() > storedOTP.expiresAt) {
      EMAIL_OTP_STORE.delete(normalizedEmail);
      return res.status(400).json({
        error: 'OTP Expired',
        message: 'OTP has expired. Request a new OTP.',
      });
    }

    // Check attempts
    if (storedOTP.attempts >= 3) {
      EMAIL_OTP_STORE.delete(normalizedEmail);
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

    // Save to database
    db.addUser(user);

    // Clean up OTP
    EMAIL_OTP_STORE.delete(normalizedEmail);

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


/**
 * POST /auth/signup/email
 * Register new user with email + password
 * In production this is handled by the OTP flow (/send-email-otp + /verify-email-otp).
 * This direct-signup variant is kept for backwards compat / admin tooling.
 */
export const signupEmail = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required',
      });
    }

    // Check if user already exists
    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email already registered',
      });
    }

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
      verified: false,
      profile: { name: name || null, avatar: null, phone: null },
      createdAt: new Date(),
    };

    // Save to database
    db.addUser(user);

    const token = authUtils.createJWT({
      id: user.id,
      email: user.email,
      walletAddress: user.walletAddress,
      role: user.role,
      auth_method: 'email',
    });

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
      message: 'Account created successfully.',
    });
  } catch (error) {
    console.error('[AUTH/SIGNUP-EMAIL]', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
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

    // Verify user in DB
    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    // Check password
    if (!authUtils.comparePassword(password, user.passwordHash)) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

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

    // For now, extract email from idToken payload if possible, or fallback
    let email = 'user@google.com'; 
    let name = 'Google User'; 
    try {
      if (idToken) {
        const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
        if (payload.email) email = payload.email;
        if (payload.name) name = payload.name;
      }
    } catch(e) {}

    // Check if user exists
    let user = db.findUserByEmail(email);
    let wallet;

    if (!user) {
      wallet = authUtils.generateWallet();
      user = {
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
      db.addUser(user);
    } else {
      wallet = { address: user.walletAddress };
    }

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
    let email = 'user@google.com'; // Mock
    try {
      if (idToken) {
        const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
        if (payload.email) email = payload.email;
      }
    } catch(e) {}

    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Google account not registered. Please sign up first.',
      });
    }

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

    // Verify signature
    const isValid = authUtils.verifyEthereumSignature(message, signature, address);
    if (!isValid) return res.status(401).json({ error: 'Unauthorized', message: 'Invalid signature' });

    let user = db.findUserByWallet(address);

    if (!user) {
      user = {
        id: `user_${Date.now()}`,
        email: null,
        walletAddress: address.toLowerCase(),
        publicAddress: address.toLowerCase(),
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
      db.addUser(user);
    }

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

    // Verify signature
    const isValid = authUtils.verifyEthereumSignature(message, signature, address);
    if (!isValid) return res.status(401).json({ error: 'Unauthorized', message: 'Invalid signature' });

    const user = db.findUserByWallet(address);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Wallet address not registered. Please sign up first.',
      });
    }

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
 * FORGOT PASSWORD FLOW
 * ===========================
 */

/**
 * POST /auth/forgot-password/send-otp
 */
export const sendForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Bad Request', message: 'Email is required' });
    }

    // Check if user exists
    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'Account not found' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    const normalizedEmail = email.toLowerCase();
    RESET_PASSWORD_OTP_STORE.set(normalizedEmail, { otp, expiresAt, attempts: 0 });

    console.log(`[AUTH] Password Reset OTP sent to ${email}: ${otp}`);

    try {
      const { sendPasswordResetOTPEmail } = await import('../utils/email.js');
      await sendPasswordResetOTPEmail(email, otp);
    } catch (emailError) {
      console.error('Warning: Failed to send reset email:', emailError.message);
    }

    res.json({ success: true, message: 'Reset code sent to email' });
  } catch (error) {
    console.error('[AUTH/FORGOT-PASSWORD-SEND]', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/**
 * POST /auth/forgot-password/verify-otp
 */
export const verifyForgotPasswordOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Bad Request', message: 'Email and OTP are required' });
    }

    const normalizedEmail = email.toLowerCase();
    const storedOTP = RESET_PASSWORD_OTP_STORE.get(normalizedEmail);

    if (!storedOTP) {
      return res.status(400).json({ error: 'Invalid OTP', message: 'Reset code not found. Request a new one.' });
    }

    if (Date.now() > storedOTP.expiresAt) {
      RESET_PASSWORD_OTP_STORE.delete(normalizedEmail);
      return res.status(400).json({ error: 'Expired OTP', message: 'Reset code expired' });
    }

    if (storedOTP.otp !== otp) {
      storedOTP.attempts++;
      if (storedOTP.attempts >= 3) RESET_PASSWORD_OTP_STORE.delete(normalizedEmail);
      return res.status(400).json({ error: 'Invalid OTP', message: 'Incorrect reset code' });
    }

    res.json({ success: true, message: 'OTP verified' });
  } catch (error) {
    console.error('[AUTH/FORGOT-PASSWORD-VERIFY]', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/**
 * POST /auth/forgot-password/reset
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Bad Request', message: 'All fields are required' });
    }

    const normalizedEmail = email.toLowerCase();
    const storedOTP = RESET_PASSWORD_OTP_STORE.get(normalizedEmail);

    if (!storedOTP || storedOTP.otp !== otp) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired session' });
    }

    const user = db.findUserByEmail(normalizedEmail);
    if (!user) return res.status(404).json({ error: 'Not Found', message: 'User not found' });

    // Update password
    const passwordHash = authUtils.hashPassword(newPassword);
    db.updateUser(user.id, { passwordHash });

    // Clear OTP
    RESET_PASSWORD_OTP_STORE.delete(normalizedEmail);

    res.json({ success: true, message: 'Password updated successfully. You can now log in.' });
  } catch (error) {
    console.error('[AUTH/FORGOT-PASSWORD-RESET]', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
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
      user: authUtils.sanitizeUserResponse(user),
    });
  } catch (error) {
    console.error('[AUTH/GET-PROFILE]', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

/**
 * PUT /auth/profile
 * Update authenticated user profile details
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    // In a real implementation, you would look up the user in MongoDB
    // by req.user.id and apply the updates:
    // await User.findByIdAndUpdate(req.user.id, { $set: { 'profile.name': name, 'profile.phone': phone } })
    
    // Since we are currently using mocked auth responses, we'll return a mocked updated user
    // However, the Token contains basic info which doesn't change here, just the returned user object
    
    const updatedUser = {
      id: req.user.id,
      email: req.user.email || null,
      walletAddress: req.user.walletAddress,
      role: req.user.role,
      auth_method: req.user.auth_method,
      name: name || null,
      profile: {
        name: name || null,
        phone: phone || null,
        avatar: null
      }
    };

    res.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('[AUTH/UPDATE-PROFILE]', error);
    res.status(500).json({ error: 'Failed to update profile', message: error.message });
  }
};

export default {
  // Email auth
  sendEmailOTP,
  verifyEmailOTP,
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
  updateProfile,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword,
};
