// ============================================================================
// OWNER LOGIN SCREEN (/login)
// ============================================================================

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve success message from password reset redirect if any
  const successMsg = location.state?.message || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await login(identifier, password);
      if (res.success) {
        if (res.needsReset) {
          // Force password reset workflow
          navigate('/reset-password', { state: { ownerId: res.ownerId } });
        } else {
          // Proceed to dashboard
          navigate('/dashboard');
        }
      } else {
        setError(res.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-text" style={{ fontSize: '28px', marginBottom: '8px' }}>RETROP</div>
          <h2>Welcome Back</h2>
          <p>Sign in to manage your restaurant</p>
        </div>

        {successMsg && <div className="auth-success">{successMsg}</div>}
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="identifier">EMAIL OR MOBILE NUMBER</label>
            <input
              type="text"
              id="identifier"
              className="form-input"
              placeholder="e.g. owner@restaurant.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">PASSWORD</label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span className="spinner animate-spin" style={{ width: '16px', height: '16px', borderTopColor: '#fff', borderWidth: '2px' }}></span>
                Signing In...
              </span>
            ) : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
