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
  const [accountType, setAccountType] = useState(() => localStorage.getItem('auth_account_type') || 'user');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    const storedWallet = localStorage.getItem('wallet_address');
    const storedType = localStorage.getItem('auth_account_type');

    if (storedToken) {
      setToken(storedToken);
      setWalletAddress(storedWallet);
      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedType) setAccountType(storedType);
    }
    setIsLoading(false);
  }, []);

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
    if (resolvedWallet) localStorage.setItem('wallet_address', resolvedWallet);
    else localStorage.removeItem('wallet_address');
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
    
    import('react-hot-toast').then(({ default: toast }) => {
      toast.success('Successfully logged out');
    });
  };

  const setAuthError = (errorMessage) => {
    setError(errorMessage);
  };

  const clearError = () => {
    setError(null);
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = accountType === 'admin' || user?.role === 'super_admin';

  const updateBlockCoins = (amount) => {
    if (user) {
      const updatedUser = { ...user, blockCoins: (user.blockCoins || 0) + amount };
      setUser(updatedUser);
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }
  };

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
    updateBlockCoins
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
