// ============================================================================
// BUSINESS SELECTOR & USER ACCOUNT HUB — /dashboard (Landing page after login)
// Shows all businesses the portal user is linked to + account profile management.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Building2, ChevronRight, LogOut, User, Sun, Moon, Sparkles,
  Package, Settings, ShieldCheck, KeyRound, Edit3, X, Check, Eye, EyeOff,
  Phone, Mail, AlertCircle, CheckCircle2
} from 'lucide-react';

function StatusBadge({ status }) {
  const colors = {
    active:          { bg: 'rgba(34,197,94,0.1)',  color: '#16a34a', label: 'Active' },
    pending_payment: { bg: 'rgba(234,179,8,0.1)',  color: '#ca8a04', label: 'Pending Payment' },
    expired:         { bg: 'rgba(239,68,68,0.1)',  color: '#dc2626', label: 'Expired' },
    suspended:       { bg: 'rgba(107,114,128,0.1)',color: '#6b7280', label: 'Suspended' },
  };
  const s = colors[status] || { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', label: status || 'Active' };
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}>
      {s.label}
    </span>
  );
}

function BusinessCard({ biz, onClick, isSelecting }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={isSelecting}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px',
        background: 'var(--color-surface)', border: `1.5px solid ${isSelecting || hovered ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 16, cursor: isSelecting ? 'wait' : 'pointer', textAlign: 'left', width: '100%',
        transition: 'all 0.2s ease',
        boxShadow: hovered ? '0 8px 24px rgba(255,107,53,0.12)' : 'var(--shadow-sm)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        opacity: isSelecting ? 0.85 : 1,
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
        background: biz.logoUrl ? 'transparent' : 'var(--color-primary-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {biz.logoUrl
          ? <img src={biz.logoUrl} alt={biz.businessName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Building2 size={24} style={{ color: 'var(--color-primary)' }} />
        }
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, letterSpacing: '-0.3px', color: 'var(--color-text)' }}>
            {biz.businessName}
          </h3>
          <StatusBadge status={biz.subscriptionStatus} />
        </div>
        {biz.address && (
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {biz.address}
          </p>
        )}
        <p style={{ fontSize: 11, color: 'var(--color-text-subtle)', margin: '3px 0 0', fontWeight: 600 }}>
          Retrop RMS &nbsp;·&nbsp; {biz.role === 'owner' ? 'Owner' : 'Manager'}
        </p>
      </div>

      {isSelecting ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary)', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
          <span className="spinner animate-spin" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: 'var(--color-primary)' }} />
          Launching...
        </div>
      ) : (
        <ChevronRight size={20} style={{ color: hovered ? 'var(--color-primary)' : 'var(--color-text-muted)', flexShrink: 0, transition: 'color 0.2s, transform 0.2s', transform: hovered ? 'translateX(3px)' : 'none' }} />
      )}
    </button>
  );
}


// ── Profile Edit Modal ───────────────────────────────────────────────────────
function ProfileModal({ user, onClose, onSave }) {
  const [name, setName] = useState(user?.name || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    if (mobile && !/^\+?[0-9]{7,15}$/.test(mobile.trim())) {
      setError('Please enter a valid mobile number (digits only).');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.portalUpdateProfile({ name: name.trim(), mobile: mobile.trim() });
      if (res.success) {
        onSave();
        onClose();
      } else {
        setError(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      setError(err.message || 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 20, maxWidth: 440, width: '100%', padding: 24, boxShadow: 'var(--shadow-md)', animation: 'scaleIn 0.2s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Edit3 size={18} style={{ color: 'var(--color-primary)' }} /> Edit Profile
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Full Name</label>
            <input
              type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} disabled={loading}
              style={{ width: '100%', padding: '10px 12px', fontSize: 14 }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Email Address (Immutable)</label>
            <input
              type="email" className="form-input" value={user?.email || ''} disabled
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, opacity: 0.7, cursor: 'not-allowed', background: 'var(--color-bg-subtle)' }}
            />
            <span style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginTop: 4, display: 'block' }}>Email cannot be changed after registration.</span>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Mobile Number</label>
            <input
              type="text" className="form-input" placeholder="+91 9876543210" value={mobile} onChange={e => setMobile(e.target.value)} disabled={loading}
              style={{ width: '100%', padding: '10px 12px', fontSize: 14 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Password Change Modal ────────────────────────────────────────────────────
function ChangePasswordModal({ onClose }) {
  const [currPwd, setCurrPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confPwd, setConfPwd] = useState('');
  const [showCurr, setShowCurr] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currPwd || !newPwd || !confPwd) {
      setError('Please fill in all fields.');
      return;
    }
    if (newPwd.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPwd !== confPwd) {
      setError('New password and confirm password do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.portalChangePassword(currPwd, newPwd);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => onClose(), 1500);
      } else {
        setError(res.message || 'Failed to change password.');
      }
    } catch (err) {
      setError(err.message || 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 20, maxWidth: 440, width: '100%', padding: 24, boxShadow: 'var(--shadow-md)', animation: 'scaleIn 0.2s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <KeyRound size={18} style={{ color: 'var(--color-primary)' }} /> Change Password
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle2 size={40} style={{ color: '#22c55e', margin: '0 auto 12px' }} />
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Password Changed!</h4>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>Your password has been updated successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurr ? 'text' : 'password'} className="form-input" value={currPwd} onChange={e => setCurrPwd(e.target.value)} disabled={loading}
                  style={{ width: '100%', padding: '10px 12px', paddingRight: 40, fontSize: 14 }}
                />
                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowCurr(v => !v); }} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                  {showCurr ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'} className="form-input" placeholder="Minimum 8 characters" value={newPwd} onChange={e => setNewPwd(e.target.value)} disabled={loading}
                  style={{ width: '100%', padding: '10px 12px', paddingRight: 40, fontSize: 14 }}
                />
                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowNew(v => !v); }} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConf ? 'text' : 'password'} className="form-input" placeholder="Repeat new password" value={confPwd} onChange={e => setConfPwd(e.target.value)} disabled={loading}
                  style={{ width: '100%', padding: '10px 12px', paddingRight: 40, fontSize: 14 }}
                />
                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConf(v => !v); }} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                  {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                Cancel
              </button>
              <button type="submit" disabled={loading} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function UserMenu({ user, onLogout, loggingOut, theme, toggleTheme, onOpenEditProfile, onOpenChangePwd }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef();

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 6px 6px',
          background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)',
          borderRadius: 99, cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
          {(user?.name || user?.email || 'U')[0].toUpperCase()}
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
          {user?.name?.split(' ')[0] || 'Account'}
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 220,
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 16, boxShadow: 'var(--shadow-md)', zIndex: 100, overflow: 'hidden',
          padding: '6px 0', animation: 'scaleIn 0.15s ease',
        }}>
          <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: 13, fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>{user?.name || 'Portal User'}</p>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
          </div>

          <button
            onClick={() => { setOpen(false); onOpenEditProfile(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--color-text)', fontWeight: 500 }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--color-bg-subtle)'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
          >
            <Edit3 size={14} /> Edit Profile
          </button>

          <button
            onClick={() => { setOpen(false); onOpenChangePwd(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--color-text)', fontWeight: 500 }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--color-bg-subtle)'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
          >
            <KeyRound size={14} /> Change Password
          </button>

          <button
            onClick={toggleTheme}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--color-text)', fontWeight: 500, borderTop: '1px solid var(--color-border)' }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--color-bg-subtle)'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>

          <button
            onClick={onLogout}
            disabled={loggingOut}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#ef4444', fontWeight: 600, borderTop: '1px solid var(--color-border)' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
          >
            {loggingOut ? (
              <><span className="spinner animate-spin" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#ef4444' }} /> Signing Out...</>
            ) : (
              <><LogOut size={14} /> Sign Out</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function BusinessSelector() {
  const { user, businesses, loading, logout, theme, toggleTheme, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [selectingId, setSelectingId] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => { document.title = 'My Businesses — Retrop'; }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      navigate('/login', { replace: true });
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <img src="/logo-corner-rounded.png" alt="Retrop" style={{ height: 32, width: 32, borderRadius: 8 }} />
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.4px' }}>Retrop</span>
          </Link>
          <UserMenu
            user={user}
            onLogout={handleLogout}
            loggingOut={loggingOut}
            theme={theme}
            toggleTheme={toggleTheme}
            onOpenEditProfile={() => setShowEditProfile(true)}
            onOpenChangePwd={() => setShowChangePwd(true)}
          />

        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, maxWidth: 680, margin: '0 auto', width: '100%', padding: '40px 20px' }}>
        {/* Clean Welcome Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
            <Sparkles size={10} /> Partner Portal
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 6, color: 'var(--color-text)' }}>
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
            Select a business below to open its dedicated operational dashboard.
          </p>
        </div>


        {/* Section title */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.3px', margin: 0 }}>
            Your Connected Businesses ({businesses.length})
          </h2>
        </div>


        {/* Business list */}
        {businesses.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {businesses.map(biz => (
              <BusinessCard
                key={biz.restaurantId}
                biz={biz}
                isSelecting={selectingId === biz.restaurantId}
                onClick={() => {
                  setSelectingId(biz.restaurantId);
                  sessionStorage.setItem('retrop_selected_restaurant', biz.restaurantId);
                  setTimeout(() => navigate('/dashboard/retrop-rms'), 150);
                }}
              />
            ))}
          </div>
        ) : (

          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--color-surface)', border: '1px dashed var(--color-border)', borderRadius: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--color-bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--color-text-muted)' }}>
              <Package size={28} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No businesses linked yet</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
              Your account isn't linked to any Retrop RMS business yet.<br />
              Contact our support team to get your restaurant registered.
            </p>
            <Link to="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, background: 'var(--color-primary)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
              Contact Support
            </Link>
          </div>
        )}
      </main>

      {showEditProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowEditProfile(false)}
          onSave={refreshUser}
        />
      )}

      {showChangePwd && (
        <ChangePasswordModal
          onClose={() => setShowChangePwd(false)}
        />
      )}

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </div>
  );
}
