// ============================================================================
// PASSWORD RESET SCREEN (/reset-password)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const ownerId = location.state?.ownerId;

  // Protect page from direct URL entry without state context
  useEffect(() => {
    if (!ownerId) {
      navigate('/login', { replace: true });
    }
  }, [ownerId, navigate]);

  if (!ownerId) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.resetPassword(ownerId, newPassword);
      if (res.success) {
        // Redirect back to login page with success notification state
        navigate('/login', {
          state: { message: 'Your password was successfully updated. Please sign in.' },
          replace: true
        });
      } else {
        setError(res.message || 'Failed to update password.');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-text" style={{ fontSize: '28px', marginBottom: '8px' }}>RETROP</div>
          <h2>Reset Your Password</h2>
          <p>You are logging in for the first time. Please update your temporary password.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">NEW PASSWORD</label>
            <input
              type="password"
              id="newPassword"
              className="form-input"
              placeholder="Min. 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">CONFIRM NEW PASSWORD</label>
            <input
              type="password"
              id="confirmPassword"
              className="form-input"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span className="spinner animate-spin" style={{ width: '16px', height: '16px', borderTopColor: '#fff', borderWidth: '2px' }}></span>
                Updating Password...
              </span>
            ) : 'Update Password & Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
