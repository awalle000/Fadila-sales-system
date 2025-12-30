import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginService, logout as logoutService, getCurrentUser } from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // ✅ Changed from localStorage to sessionStorage
      const token = sessionStorage.getItem('token');
      const savedUser = sessionStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Verify token is still valid by fetching current user from backend
          const userData = await getCurrentUser();
          setUser(userData);
          // Update sessionStorage with fresh data
          sessionStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('Token validation failed:', error);
          // Token is invalid, clear everything
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // ✅ REMOVED storage event listener
  // sessionStorage is already isolated per tab, no need to sync across tabs

  const login = async (email, password) => {
    try {
      const data = await loginService(email, password);
      setUser(data);
      toast.success(`Welcome back, ${data.name}!`);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutService();
      // ✅ Changed from localStorage to sessionStorage
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear session data even if server logout fails
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      // ✅ Changed from localStorage to sessionStorage
      sessionStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error refreshing user:', error);
      // If refresh fails, user might be logged out
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      setUser(null);
    }
  };

  const value = {
    user,
    login,
    logout,
    refreshUser,
    loading,
    isAuthenticated: !!user,
    isCEO: user?.role === 'ceo',
    isManager: user?.role === 'manager'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};