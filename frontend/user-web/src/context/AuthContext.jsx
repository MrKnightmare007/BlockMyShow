import React, { createContext, useState, useEffect } from 'react';

/**
 * AuthContext
 * Manages user authentication state, wallet, and JWT token
 * Persists state to localStorage
 */

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    const storedWallet = localStorage.getItem('wallet_address');

    if (storedToken) {
      setToken(storedToken);
      setWalletAddress(storedWallet);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData, jwtToken, walletAddr) => {
    setUser(userData);
    setToken(jwtToken);
    setWalletAddress(walletAddr);
    setError(null);

    // Persist to localStorage
    localStorage.setItem('auth_token', jwtToken);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    localStorage.setItem('wallet_address', walletAddr);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setWalletAddress(null);
    setError(null);

    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('wallet_address');
  };

  const setAuthError = (errorMessage) => {
    setError(errorMessage);
  };

  const clearError = () => {
    setError(null);
  };

  const isAuthenticated = !!token && !!user;

  const value = {
    user,
    token,
    walletAddress,
    isLoading,
    error,
    isAuthenticated,
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
