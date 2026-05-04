import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Admin Auth Context for Expo
 * Manages admin authentication, role, and permissions
 */

interface Admin {
  id: string;
  username: string;
  role: 'super_admin' | 'admin' | 'gate_operator' | 'event_creator';
}

interface AdminAuthContextType {
  admin: Admin | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (admin: Admin, token: string) => Promise<void>;
  logout: () => Promise<void>;
  setError: (error: string | null) => void;
}

export const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load from AsyncStorage on mount
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('admin_token');
        const storedAdmin = await AsyncStorage.getItem('admin_user');

        if (storedToken && storedAdmin) {
          setToken(storedToken);
          setAdmin(JSON.parse(storedAdmin));
        }
      } catch (err) {
        console.error('Failed to restore auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuth();
  }, []);

  const login = async (adminData: Admin, jwtToken: string) => {
    try {
      setAdmin(adminData);
      setToken(jwtToken);
      setError(null);

      // Persist to AsyncStorage
      await AsyncStorage.setItem('admin_token', jwtToken);
      await AsyncStorage.setItem('admin_user', JSON.stringify(adminData));
    } catch (err) {
      console.error('Failed to save auth:', err);
      setError('Failed to save authentication');
    }
  };

  const logout = async () => {
    try {
      setAdmin(null);
      setToken(null);
      setError(null);

      // Clear AsyncStorage
      await AsyncStorage.removeItem('admin_token');
      await AsyncStorage.removeItem('admin_user');
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  const isAuthenticated = !!token && !!admin;

  const value: AdminAuthContextType = {
    admin,
    token,
    isLoading,
    error,
    isAuthenticated,
    login,
    logout,
    setError,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export default AdminAuthContext;
