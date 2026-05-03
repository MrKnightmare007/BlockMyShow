/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState } from 'react';

/**
 * AuthContext
 * Manages user authentication state, wallet, and JWT token
 * Persists state to localStorage
 */

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('auth_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [walletAddress, setWalletAddress] = useState(() => localStorage.getItem('wallet_address'));
  const [accountType, setAccountType] = useState(() => localStorage.getItem('auth_account_type') || 'user');
  const [isLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = (userData, jwtToken, walletAddr, type = 'user') => {
    const resolvedWallet = walletAddr || userData?.wallet_address || userData?.walletAddress || null;

    setUser(userData);
    setToken(jwtToken);
    setWalletAddress(resolvedWallet);
    setAccountType(type);
    setError(null);

    // Persist to localStorage
    localStorage.setItem('auth_token', jwtToken);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    localStorage.setItem('auth_account_type', type);

    if (resolvedWallet) {
      localStorage.setItem('wallet_address', resolvedWallet);
    } else {
      localStorage.removeItem('wallet_address');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setWalletAddress(null);
    setAccountType('user');
    setError(null);

    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('auth_account_type');
  };

  const setAuthError = (errorMessage) => {
    setError(errorMessage);
  };

  const clearError = () => {
    setError(null);
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = accountType === 'admin' || user?.role === 'super_admin';

  const value = {
    user,
    token,
    walletAddress,
    wallet_address: walletAddress,
    accountType,
    isLoading,
    error,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    setAuthError,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
