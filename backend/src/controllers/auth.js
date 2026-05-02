import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';

/**
 * Authentication Controller
 * Handles user login, wallet generation, profile management
 */

/**
 * Login or register user
 * Creates JWT token for subsequent authenticated requests
 */
export const login = async (req, res) => {
  try {
    const { email, password, googleToken } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required',
      });
    }

    // TODO: In production, verify user exists in DB
    // For now, create a mock user
    const user = {
      id: `user_${Date.now()}`,
      email,
      walletAddress: ethers.Wallet.createRandom().address,
      role: 'user',
      createdAt: new Date(),
    };

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    res.status(201).json({
      user,
      token,
      message: 'Logged in successfully',
    });
  } catch (error) {
    console.error('[AUTH/LOGIN]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Logout user
 * Token is invalidated on client-side by removing from localStorage
 */
export const logout = async (req, res) => {
  try {
    // In production, add token to blacklist if needed
    res.json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('[AUTH/LOGOUT]', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get user's Web3 wallet
 * Generates wallet if it doesn't exist
 */
export const getWallet = async (req, res) => {
  try {
    const userId = req.user.id;

    // TODO: Check if wallet exists in DB for user
    // For now, return user's stored wallet or generate new one
    const wallet = {
      address: req.user.walletAddress,
      publicKey: ethers.utils.computePublicKey(ethers.Wallet.createRandom().publicKey),
      chainId: parseInt(process.env.CHAIN_ID || '84532'),
      network: process.env.BLOCKCHAIN_NETWORK || 'baseSepolia',
    };

    res.json({
      wallet,
      message: 'Wallet retrieved successfully',
    });
  } catch (error) {
    console.error('[AUTH/WALLET]', error);
    res.status(500).json({ error: 'Failed to retrieve wallet' });
  }
};

/**
 * Get authenticated user's profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = {
      id: req.user.id,
      email: req.user.email,
      walletAddress: req.user.walletAddress,
      role: req.user.role,
      createdAt: new Date(),
    };

    res.json({ user });
  } catch (error) {
    console.error('[AUTH/PROFILE]', error);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;

    // TODO: Update user in DB with new profile data
    const updatedUser = {
      id: req.user.id,
      email: req.user.email,
      walletAddress: req.user.walletAddress,
      role: req.user.role,
      name,
      phone,
      avatar,
      updatedAt: new Date(),
    };

    res.json({
      user: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('[AUTH/UPDATE-PROFILE]', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * Refresh JWT token
 * Issues a new token with an extended expiration
 */
export const refreshToken = async (req, res) => {
  try {
    const newToken = jwt.sign(
      {
        id: req.user.id,
        email: req.user.email,
        walletAddress: req.user.walletAddress,
        role: req.user.role,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    res.json({
      token: newToken,
      expiresIn: process.env.JWT_EXPIRY || '7d',
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    console.error('[AUTH/REFRESH]', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
};

export default {
  login,
  logout,
  getWallet,
  getProfile,
  updateProfile,
  refreshToken,
};
