// ============================================================================
// AUTHENTICATION & GLOBAL THEME CONTEXT (Portal User Model)
// ============================================================================
// Manages portal user sessions (separate from old retrop_owner system).
// Token key: 'retrop_portal_token'
// User object: { userId, name, email, mobile, businesses[] }
// ============================================================================

import React, { createContext, useState, useEffect, useContext } from 'react';
import { createClient } from '@supabase/supabase-js';
import { api } from '../services/api';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
const TOKEN_KEY     = 'retrop_portal_token';

export const supabaseClient = SUPABASE_URL && SUPABASE_ANON
  ? createClient(SUPABASE_URL, SUPABASE_ANON)
  : null;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState('');


  // Theme
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('retrop_theme');
    if (saved) return saved;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });

  // Sync theme with HTML attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('retrop_theme', theme);
  }, [theme]);

  // ── Restore session on startup ─────────────────────────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        try {
          const res = await api.portalGetMe();
          if (res.success && res.data?.user) {
            setUser(res.data.user);
            setBusinesses(res.data.user.businesses || []);
          } else {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem('retrop_owner_token');
          }
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem('retrop_owner_token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // ── Login (email + password) ───────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const res = await api.portalLogin(email, password);
      if (res.success && res.data?.accessToken) {
        localStorage.setItem(TOKEN_KEY, res.data.accessToken);
        localStorage.setItem('retrop_owner_token', res.data.accessToken);
        setUser(res.data.user);
        setBusinesses(res.data.user?.businesses || []);
        return { success: true, needsReset: res.needsReset || false, userId: res.data?.user?.userId };
      }

      return { success: false, error: res.message || 'Login failed' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };


  // ── Google Login ───────────────────────────────────────────────────────────
  const googleLogin = async () => {
    if (!supabaseClient) return { success: false, error: 'Google auth not configured' };
    try {
      setOauthError('');
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) {
        setOauthError(error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      setOauthError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Handle Supabase OAuth callback — exchange Supabase session for portal token
  useEffect(() => {
    if (!supabaseClient) return;
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.access_token && !localStorage.getItem(TOKEN_KEY)) {
        setOauthLoading(true);
        setOauthError('');
        try {
          const res = await api.portalGoogleAuth(session.access_token);
          if (res.success && res.data?.accessToken) {
            localStorage.setItem(TOKEN_KEY, res.data.accessToken);
            localStorage.setItem('retrop_owner_token', res.data.accessToken);
            setUser(res.data.user);
            setBusinesses(res.data.user?.businesses || []);
            // Only redirect on SUCCESSful verification
            if (window.location.pathname !== '/dashboard') {
              window.location.href = '/dashboard';
            } else {
              setOauthLoading(false);
            }
          } else {
            // Verification failed — DO NOT redirect
            setOauthLoading(false);
            setOauthError(res.message || 'Google verification failed. Please try again.');
          }
        } catch (err) {
          console.error('Google auth exchange failed:', err.message);
          // On error — DO NOT redirect
          setOauthLoading(false);
          setOauthError(err.message || 'Google verification failed. Please try again.');
        }
      }
    });
    return () => subscription?.unsubscribe();
  }, []);


  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await api.portalLogout();
      if (supabaseClient) await supabaseClient.auth.signOut();
    } catch {}
    finally {
      setUser(null);
      setBusinesses([]);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('retrop_owner_token');
    }
  };


  // ── Theme toggle ───────────────────────────────────────────────────────────
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // ── Update profile in state after API call ─────────────────────────────────
  const refreshUser = async () => {
    try {
      const res = await api.portalGetMe();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setBusinesses(res.data.user.businesses || []);
      }
    } catch {}
  };

  // ── Legacy owner/restaurant compatibility shim ─────────────────────────────
  // The old Dashboard.jsx used `owner` and `restaurant` from context.
  // Provide shims so old code doesn't break while we migrate.
  const owner = user ? {
    ownerId: user.userId,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
  } : null;

  const restaurant = businesses.length > 0 ? businesses[0] : null;

  return (
    <AuthContext.Provider value={{
      // New portal model
      user, businesses, loading, login, googleLogin, logout, refreshUser,
      oauthLoading, oauthError, setOauthError,
      // Theme
      theme, toggleTheme,
      // Legacy shim (for old Dashboard.jsx compatibility)
      owner, restaurant,
      setOwner: () => {}, setRestaurant: () => {},
    }}>
      {children}
      {oauthLoading && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '16px', color: '#fff', textAlign: 'center', padding: '24px',
          animation: 'fadeIn 0.2s ease',
        }}>
          <span className="spinner animate-spin" style={{ width: 36, height: 36, borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#fff' }} />
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: 0, letterSpacing: '-0.2px' }}>
            Redirecting...
          </p>
        </div>
      )}

    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
