// ============================================================================
// AUTHENTICATION & GLOBAL THEME CONTEXT
// ============================================================================

import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [owner, setOwner] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('retrop_theme');
    if (savedTheme) return savedTheme;
    
    // Fallback to system preference
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Sync theme with HTML attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('retrop_theme', theme);
  }, [theme]);

  // Load user profile on startup
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('retrop_owner_token');
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success && res.data) {
            setOwner(res.data.owner);
            setRestaurant(res.data.restaurant);
          } else {
            localStorage.removeItem('retrop_owner_token');
          }
        } catch (err) {
          console.error('Failed to restore owner session:', err.message);
          localStorage.removeItem('retrop_owner_token');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (loginIdentifier, password) => {
    try {
      const res = await api.login(loginIdentifier, password);
      
      // If password reset required on first login, pass it downstream to UI
      if (res.success && res.needsReset) {
        return { success: true, needsReset: true, ownerId: res.data.ownerId };
      }

      if (res.success && res.data.accessToken) {
        localStorage.setItem('retrop_owner_token', res.data.accessToken);
        setOwner(res.data.owner);
        setRestaurant(res.data.restaurant || null);
        return { success: true, needsReset: false };
      }
      return { success: false, error: 'Login failed' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.warn('Network logout failed, clearing local state.');
    } finally {
      setOwner(null);
      setRestaurant(null);
      localStorage.removeItem('retrop_owner_token');
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <AuthContext.Provider value={{ owner, restaurant, loading, login, logout, theme, toggleTheme, setOwner, setRestaurant }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
