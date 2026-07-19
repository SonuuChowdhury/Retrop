// ============================================================================
// UNIVERSAL LOGIN PAGE (/login) — Universal branding, multi-step, inline reset
// Optimized for small laptop screens at 100% zoom (no vertical overflow)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Eye, EyeOff, ArrowLeft, X, Clock, ShieldCheck, Sparkles, Sun, Moon } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function ComingSoonModal({ onClose }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',性能: 'blur(4px)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, animation: 'fadeIn 0.2s ease', padding: '24px' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '24px', padding: '32px 28px', maxWidth: '380px', width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.15)', animation: 'scaleIn 0.25s ease', textAlign: 'center', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '8px' }}>
          <X size={18} />
        </button>
        <div style={{ width: 64, height: 64, borderRadius: '16px', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', margin: '0 auto 20px' }}>
          <Clock size={28} />
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '10px' }}>Coming Soon!</h3>
        <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '24px' }}>
          We're actively building self-service sign-up and Google authentication.
          In the meantime, reach out and we'll set you up personally.
        </p>
        <a href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: '13px', textDecoration: 'none', boxShadow: '0 6px 20px rgba(255,107,53,0.28)', marginBottom: '12px' }}>
          Contact Us
        </a>
        <br />
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>
          Maybe later
        </button>
      </div>
    </div>
  );
}

function LoginStep({ onResetNeeded, onShowComingSoon, successMsg }) {
  const [id,      setId]      = useState('');
  const [pwd,     setPwd]     = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [tab,     setTab]     = useState('login');
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate  = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!id || !pwd) { setError('Please fill in all fields.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await login(id, pwd);
      if (res.success) {
        if (res.needsReset) {
          onResetNeeded(res.userId, pwd);
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(res.error || 'Invalid credentials. Please try again.');
      }
    } catch { setError('Connection error. Please try again.'); }
    finally { setLoading(false); }
  };


  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const res = await googleLogin();
      if (!res.success) setError(res.error || 'Google sign-in failed');
      // On success, Supabase redirects the page — no further action needed
    } catch { setError('Google sign-in failed. Please try again.'); }
    finally { setGoogleLoading(false); }
  };

  return (
    <div style={{ animation: 'fadeInUp 0.35s ease both' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--color-bg-subtle)', borderRadius: '12px', padding: '4px', marginBottom: '16px' }}>
        <button
          type="button"
          style={{ flex: 1, padding: '7px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer', background: tab === 'login' ? 'var(--color-surface)' : 'transparent', color: tab === 'login' ? 'var(--color-text)' : 'var(--color-text-muted)', boxShadow: tab === 'login' ? 'var(--shadow-sm)' : 'none', transition: 'all 0.2s ease' }}
          onClick={() => setTab('login')}
        >Sign In</button>
        <button
          type="button"
          style={{ flex: 1, padding: '7px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer', background: tab === 'signup' ? 'var(--color-surface)' : 'transparent', color: tab === 'signup' ? 'var(--color-text)' : 'var(--color-text-muted)', boxShadow: tab === 'signup' ? 'var(--shadow-sm)' : 'none', transition: 'all 0.2s ease' }}
          onClick={() => navigate('/signup')}
        >Sign Up</button>
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', marginBottom: '16px', opacity: googleLoading ? 0.7 : 1 }}
        onMouseOver={e => { if (!googleLoading) e.currentTarget.style.borderColor = 'var(--color-border-strong)'; }}
        onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
      >
        {googleLoading ? <span className="spinner animate-spin" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <GoogleIcon />}
        {googleLoading ? 'Opening Google...' : 'Continue with Google'}
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-subtle)', textTransform: 'uppercase' }}>
        <span style={{ flex: 1, height: 1, background: 'var(--color-border)' }} /> or <span style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
      </div>

      {successMsg && <div className="auth-success" style={{ padding: '8px 12px', fontSize: '12px', marginBottom: '12px' }}>{successMsg}</div>}
      {error       && <div className="auth-error" style={{ padding: '8px 12px', fontSize: '12px', marginBottom: '12px' }}>{error}</div>}

      <form onSubmit={handleLogin} noValidate>
        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label htmlFor="login-id" style={{ fontSize: '12px', marginBottom: '6px' }}>Email or Mobile</label>
          <input id="login-id" type="text" className="form-input" placeholder="you@example.com" value={id} onChange={e => setId(e.target.value)} disabled={loading} autoComplete="username" style={{ padding: '10px 12px', fontSize: '13.5px' }} />
        </div>
        <div className="form-group" style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label htmlFor="login-pwd" style={{ fontSize: '12px' }}>Password</label>
            <Link to="/forgot-password" style={{ fontSize: '11px', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>Forgot password?</Link>
          </div>
          <div style={{ position: 'relative' }}>
            <input id="login-pwd" type={showPwd ? 'text' : 'password'} className="form-input" placeholder="Enter your password" value={pwd} onChange={e => setPwd(e.target.value)} disabled={loading} autoComplete="current-password" style={{ padding: '10px 12px', paddingRight: '40px', fontSize: '13.5px' }} />
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPwd(v => !v); }} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}>
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <button type="submit" style={{ width: '100%', padding: '11px', borderRadius: '8px', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s ease' }} disabled={loading}>
          {loading ? (<><span className="spinner animate-spin" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#fff' }} /> Signing In...</>) : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

function ResetStep({ userId, currentPwd, onBack }) {
  const [newPwd,  setNewPwd]  = useState('');
  const [confPwd, setConfPwd] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    if (!newPwd || !confPwd) { setError('Please fill in both fields.'); return; }
    if (newPwd.length < 8)   { setError('Password must be at least 8 characters.'); return; }
    if (newPwd !== confPwd)  { setError('Passwords do not match.'); return; }
    setError(''); setLoading(true);
    try {
      let res = await api.portalChangePassword(currentPwd, newPwd);
      if (!res.success && userId) {
        res = await api.portalSetSignupPassword(userId, newPwd);
      }
      if (res.success) {
        setDone(true);
        setTimeout(() => navigate('/dashboard'), 1200);
      } else {
        setError(res.message || 'Failed to update password.');
      }
    } catch (err) { setError(err.message || 'Connection error.'); }
    finally { setLoading(false); }
  };

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '10px 0', animation: 'fadeInUp 0.35s ease both' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(46,196,182,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--color-success)' }}>
          <ShieldCheck size={28} />
        </div>
        <h3 style={{ fontWeight: 800, fontSize: '18px', marginBottom: '6px' }}>Password Updated!</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Taking you to your dashboard…</p>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeInUp 0.35s ease both' }}>
      <button type="button" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, padding: '0', marginBottom: '16px' }}>
        <ArrowLeft size={13} /> Back to Sign In
      </button>
      <div style={{ width: 40, height: 40, background: 'var(--color-primary-light)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', marginBottom: '12px' }}>
        <ShieldCheck size={20} />
      </div>
      <h3 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '4px' }}>Set a new password</h3>
      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>First-time login detected. Set your permanent password to continue.</p>
      {error && <div className="auth-error" style={{ padding: '8px 12px', fontSize: '12px', marginBottom: '12px' }}>{error}</div>}
      <form onSubmit={handleReset} noValidate>
        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label htmlFor="new-pwd" style={{ fontSize: '12px', marginBottom: '6px' }}>New Password</label>
          <div style={{ position: 'relative' }}>
            <input id="new-pwd" type={showNew ? 'text' : 'password'} className="form-input" placeholder="Minimum 8 characters" value={newPwd} onChange={e => setNewPwd(e.target.value)} disabled={loading} style={{ padding: '10px 12px', paddingRight: '40px', fontSize: '13.5px' }} />
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowNew(v => !v); }} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}>
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label htmlFor="conf-pwd" style={{ fontSize: '12px', marginBottom: '6px' }}>Confirm Password</label>
          <div style={{ position: 'relative' }}>
            <input id="conf-pwd" type={showCon ? 'text' : 'password'} className="form-input" placeholder="Repeat your new password" value={confPwd} onChange={e => setConfPwd(e.target.value)} disabled={loading} style={{ padding: '10px 12px', paddingRight: '40px', fontSize: '13.5px' }} />
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowCon(v => !v); }} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}>
              {showCon ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <button type="submit" style={{ width: '100%', padding: '11px', borderRadius: '8px', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s ease' }} disabled={loading}>
          {loading ? (<><span className="spinner animate-spin" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#fff' }} /> Updating...</>) : 'Update Password & Continue'}
        </button>
      </form>
    </div>
  );
}

export default function Login() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const successMsg = location.state?.message || '';
  const { user, theme, toggleTheme } = useAuth();

  const [step,          setStep]          = useState('login');
  const [resetUserId,   setResetUserId]   = useState(null);
  const [currentPwd,    setCurrentPwd]    = useState('');

  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    document.title = 'Sign In — Retrop';
    if (user || localStorage.getItem('retrop_portal_token')) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);


  return (
    <div style={{
      height: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr',
      background: 'var(--color-bg)',
      animation: 'fadeIn 0.4s ease',
      overflow: 'hidden',
    }} className="login-page-grid">
      {/* ── Brand Side ─────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(145deg, #0f1117 0%, #1a1d2e 50%, #1f2333 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: 'clamp(24px, 4vh, 48px) clamp(24px, 4vw, 56px)', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,53,0.12) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

        {/* Home link */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', position: 'relative', zIndex: 1, alignSelf: 'flex-start' }}>
          <img src="/logo-corner-rounded.png" alt="Retrop" style={{ height: '36px', width: '36px', borderRadius: '10px', objectFit: 'cover' }} />
          <span style={{ fontSize: '17px', fontWeight: 800, color: '#fff', letterSpacing: '-0.4px' }}>Retrop</span>
        </Link>

        {/* Brand Center Info */}
        <div style={{ position: 'relative', zIndex: 1, margin: '20px 0' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '9999px', background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.2)', color: 'rgba(255,107,53,0.9)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '16px' }}>
            <Sparkles size={10} /> Business Automation Platform
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 3vh, 36px)', fontWeight: 800, color: '#fff', letterSpacing: '-1.2px', lineHeight: 1.2, marginBottom: '12px' }}>
            The smarter way to run your business
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: '0' }}>
            Sign in to access your dashboard and manage everything — inventory, team, orders, and analytics — in one place.
          </p>

          <div style={{ marginTop: 'clamp(24px, 4vh, 40px)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {['Real-time operational tracking', 'AI-powered cost & margin insights', 'Team & vendor coordination', 'Automated reporting & analytics'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0 }} />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Small footer brand note */}
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', zIndex: 1 }}>
          Powering modern businesses nationwide.
        </div>
      </div>

      {/* ── Form Side ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px, 4vh, 48px) 32px', overflowY: 'auto', position: 'relative' }}>
        {/* Top controls */}
        <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link to="/" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', transition: 'all 0.2s ease' }}

            onMouseOver={e => { e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.borderColor = 'var(--color-border-strong)'; }}
            onMouseOut={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
          >
            ← Home
          </Link>
        </div>

        <div style={{ width: '100%', maxWidth: '350px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 'clamp(16px, 3vh, 24px)' }}>
            <img src="/logo-corner-rounded.png" alt="Retrop" style={{ width: 36, height: 36, borderRadius: '10px', margin: '0 auto 12px' }} />
            <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: '4px' }}>
              {step === 'reset' ? 'Secure your account' : 'Welcome back'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {step === 'reset' ? 'Set a new password to continue' : 'Sign in to your Retrop account'}
            </p>
          </div>

          {step === 'login' && (
            <LoginStep
              onResetNeeded={(uid, currentPassword) => {
                setResetUserId(uid);
                setCurrentPwd(currentPassword);
                setStep('reset');
              }}
              onShowComingSoon={() => setShowComingSoon(true)}
              successMsg={successMsg}
            />
          )}
          {step === 'reset' && (
            <ResetStep
              userId={resetUserId}
              currentPwd={currentPwd}
              onBack={() => setStep('login')}
            />
          )}


          <p style={{ fontSize: '11px', color: 'var(--color-text-subtle)', textAlign: 'center', marginTop: '16px', lineHeight: 1.5 }}>
            By signing in, you agree to our{' '}
            <Link to="/terms-of-service" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Terms</Link>
            {' & '}
            <Link to="/privacy-policy" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Privacy Policy</Link>
          </p>
        </div>
      </div>

      {showComingSoon && <ComingSoonModal onClose={() => setShowComingSoon(false)} />}

      <style>{`
        @media (max-width: 960px) {
          .login-page-grid { grid-template-columns: 1fr !important; }
          .login-page-grid > *:first-child { display: none !important; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1);    }
        }
      `}</style>
    </div>
  );
}
