// ============================================================================
// SIGNUP PAGE (/signup) — 3-step: name+email → OTP → set password
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Eye, EyeOff, ArrowLeft, CheckCircle2, Mail, Lock, User,
  ShieldCheck, Sparkles, Sun, Moon, AlertCircle
} from 'lucide-react';

// ── Password Strength ────────────────────────────────────────────────────────
function getPasswordStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];
  return { score, label: labels[score] || '', color: colors[score] || '' };
}

// ── OTP Input ────────────────────────────────────────────────────────────────
function OtpInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = value.split('');

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !e.target.value && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handleChange = (i, e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      const next = [...digits];
      next[i] = '';
      onChange(next.join(''));
      return;
    }
    // Handle paste
    if (raw.length > 1) {
      const pasted = raw.slice(0, 6).split('');
      const next = Array(6).fill('');
      pasted.forEach((ch, idx) => { if (idx < 6) next[idx] = ch; });
      onChange(next.join(''));
      inputs.current[Math.min(pasted.length, 5)]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = raw[0];
    onChange(next.join(''));
    if (i < 5) inputs.current[i + 1]?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
      {Array(6).fill('').map((_, i) => (
        <input
          key={i}
          ref={el => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={digits[i] || ''}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          style={{
            width: 44, height: 52, textAlign: 'center', fontSize: '22px', fontWeight: 800,
            border: `2px solid ${digits[i] ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: 10, background: 'var(--color-surface)', color: 'var(--color-text)',
            outline: 'none', transition: 'border-color 0.15s',
            fontFamily: 'monospace',
          }}
        />
      ))}
    </div>
  );
}

// ── Step 1: Name + Email ─────────────────────────────────────────────────────
function StepEmail({ onNext }) {
  const navigate = useNavigate();
  const [name,          setName]          = useState('');
  const [email,         setEmail]         = useState('');
  const [error,         setError]         = useState('');
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { googleLogin } = useAuth();

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const res = await googleLogin();
      if (!res.success) setError(res.error || 'Google sign-in failed');
    } catch {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const validate = () => {
    if (!name.trim() || name.trim().length < 2) return 'Full name must be at least 2 characters';
    if (!email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email address';
    return '';
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.portalRequestSignupOtp(name.trim(), email.trim());
      if (res.success) onNext(name.trim(), email.trim());
      else setError(res.message || 'Failed to send OTP');
    } catch (e) { setError(e.message || 'Connection error'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ animation: 'fadeInUp 0.3s ease both' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--color-bg-subtle)', borderRadius: '12px', padding: '4px', marginBottom: '16px' }}>
        <button
          type="button"
          style={{ flex: 1, padding: '7px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent', color: 'var(--color-text-muted)', transition: 'all 0.2s ease' }}
          onClick={() => navigate('/login')}
        >Sign In</button>
        <button
          type="button"
          style={{ flex: 1, padding: '7px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'var(--color-surface)', color: 'var(--color-text)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s ease' }}
        >Sign Up</button>
      </div>

      {/* Google Sign In */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: '10px',
          border: '1px solid var(--color-border)', background: 'var(--color-surface)',
          color: 'var(--color-text)', fontWeight: 600, fontSize: '13.5px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          cursor: 'pointer', transition: 'all 0.2s ease', marginBottom: '16px',
        }}
      >

        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: 0.8 }}>or register with email</span>
        <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--color-error-bg, rgba(239,68,68,0.08))', border: '1px solid var(--color-error, #ef4444)', borderRadius: 10, marginBottom: 16, fontSize: 13, color: 'var(--color-error, #ef4444)' }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--color-text-muted)' }}>Full Name</label>
          <div style={{ position: 'relative' }}>
            <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text" className="form-input" placeholder="Your full name"
              value={name} onChange={e => setName(e.target.value)}
              disabled={loading || googleLoading} autoFocus
              style={{ paddingLeft: 36, fontSize: 14 }}
            />
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--color-text-muted)' }}>Email Address</label>
          <div style={{ position: 'relative' }}>
            <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="email" className="form-input" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              disabled={loading || googleLoading}
              style={{ paddingLeft: 36, fontSize: 14 }}
            />
          </div>
        </div>
        <button type="submit" disabled={loading || googleLoading} style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
          {loading ? <><span className="spinner animate-spin" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#fff' }} /> Sending OTP...</> : 'Send Verification Code →'}
        </button>
      </form>
    </div>
  );
}


// ── Step 2: OTP Verification ─────────────────────────────────────────────────
function StepOtp({ name, email, onNext, onBack }) {
  const [otp,     setOtp]     = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(60);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (otp.length < 6) { setError('Please enter all 6 digits'); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.portalVerifySignupOtp(name, email, otp);
      if (res.success) onNext(res.data.userId);
      else setError(res.message || 'Invalid OTP');
    } catch (e) { setError(e.message || 'Connection error'); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    try {
      await api.portalRequestSignupOtp(name, email);
      setResendIn(60); setOtp(''); setError('');
    } catch {}
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ animation: 'fadeInUp 0.3s ease both' }}>
      <button type="button" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: 0, marginBottom: 16 }}>
        <ArrowLeft size={13} /> Back
      </button>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: 24 }}>
        We sent a 6-digit code to <strong style={{ color: 'var(--color-text)' }}>{email}</strong>
      </p>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid #ef4444', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#ef4444' }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}
      <div style={{ marginBottom: 24 }}>
        <OtpInput value={otp} onChange={setOtp} />
      </div>
      <button type="submit" disabled={loading || otp.length < 6} style={{ width: '100%', padding: '12px', borderRadius: 10, background: otp.length === 6 ? 'var(--color-primary)' : 'var(--color-bg-subtle)', color: otp.length === 6 ? '#fff' : 'var(--color-text-muted)', fontWeight: 700, fontSize: 14, border: 'none', cursor: otp.length === 6 ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
        {loading ? <><span className="spinner animate-spin" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: 'currentColor' }} /> Verifying...</> : 'Verify Code →'}
      </button>
      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)', marginTop: 14 }}>
        {resendIn > 0
          ? <>Resend available in <strong>{resendIn}s</strong></>
          : <button type="button" onClick={handleResend} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>Resend Code</button>
        }
      </p>
    </form>
  );
}

// ── Step 3: Set Password ──────────────────────────────────────────────────────
function StepPassword({ userId, onDone }) {
  const [pwd,     setPwd]     = useState('');
  const [conf,    setConf]    = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const strength = getPasswordStrength(pwd);

  const validate = () => {
    if (!pwd) return 'Password is required';
    if (pwd.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pwd)) return 'Must include an uppercase letter';
    if (!/[0-9]/.test(pwd)) return 'Must include a number';
    if (pwd !== conf) return 'Passwords do not match';
    return '';
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.portalSetSignupPassword(userId, pwd);
      if (res.success) onDone();
      else setError(res.message || 'Failed to set password');
    } catch (e) { setError(e.message || 'Connection error'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ animation: 'fadeInUp 0.3s ease both' }}>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid #ef4444', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#ef4444' }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--color-text-muted)' }}>New Password</label>
        <div style={{ position: 'relative' }}>
          <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type={showPwd ? 'text' : 'password'} className="form-input"
            placeholder="Minimum 8 characters" value={pwd}
            onChange={e => setPwd(e.target.value)} disabled={loading}
            style={{ paddingLeft: 36, paddingRight: 40, fontSize: 14 }}
          />
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPwd(v => !v); }} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4 }}>
            {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {pwd && (
          <div style={{ marginTop: 8 }}>
            <div style={{ height: 4, borderRadius: 4, background: 'var(--color-border)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(strength.score / 5) * 100}%`, background: strength.color, transition: 'all 0.3s', borderRadius: 4 }} />
            </div>
            <p style={{ fontSize: 11, color: strength.color, marginTop: 4, fontWeight: 600 }}>{strength.label}</p>
          </div>
        )}
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--color-text-muted)' }}>Confirm Password</label>
        <div style={{ position: 'relative' }}>
          <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type={showCon ? 'text' : 'password'} className="form-input"
            placeholder="Repeat your password" value={conf}
            onChange={e => setConf(e.target.value)} disabled={loading}
            style={{ paddingLeft: 36, paddingRight: 40, fontSize: 14 }}
          />
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowCon(v => !v); }} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4 }}>
            {showCon ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {conf && pwd && (
          <p style={{ fontSize: 11, marginTop: 4, fontWeight: 600, color: pwd === conf ? '#22c55e' : '#ef4444' }}>
            {pwd === conf ? '✓ Passwords match' : '✗ Passwords do not match'}
          </p>
        )}
      </div>
      <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
        {loading ? <><span className="spinner animate-spin" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#fff' }} /> Creating Account...</> : 'Create My Account →'}
      </button>
    </form>
  );
}

// ── Success state ─────────────────────────────────────────────────────────────
function StepSuccess() {
  const navigate = useNavigate();
  useEffect(() => {
    setTimeout(() => navigate('/login', { state: { message: 'Account created! Please sign in.' } }), 2500);
  }, []);
  return (
    <div style={{ textAlign: 'center', padding: '20px 0', animation: 'fadeInUp 0.3s ease both' }}>
      <div style={{ width: 64, height: 64, background: 'rgba(34,197,94,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#22c55e' }}>
        <CheckCircle2 size={32} />
      </div>
      <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>Account Created! 🎉</h3>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Redirecting you to sign in...</p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Signup() {
  const { user, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const [step,   setStep]   = useState('email');
  const [name,   setName]   = useState('');
  const [email,  setEmail]  = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    document.title = 'Create Account — Retrop';
    if (user || localStorage.getItem('retrop_portal_token')) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);


  const stepLabels = ['Details', 'Verify Email', 'Set Password'];
  const stepIndex  = { email: 0, otp: 1, password: 2, done: 3 };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--color-bg)', overflow: 'hidden' }} className="login-page-grid">
      {/* Brand side */}
      <div style={{ background: 'linear-gradient(145deg, #0f1117 0%, #1a1d2e 50%, #1f2333 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 'clamp(24px, 4vh, 48px) clamp(24px, 4vw, 56px)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,53,0.12) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', position: 'relative', zIndex: 1 }}>
          <img src="/logo-corner-rounded.png" alt="Retrop" style={{ height: 36, width: 36, borderRadius: 10 }} />
          <span style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>Retrop</span>
        </Link>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 9999, background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.2)', color: 'rgba(255,107,53,0.9)', fontSize: 11, fontWeight: 700, marginBottom: 16 }}>
            <Sparkles size={10} /> Join Retrop Partner Network
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 3vh, 34px)', fontWeight: 800, color: '#fff', letterSpacing: '-1.2px', lineHeight: 1.2, marginBottom: 12 }}>
            Start managing your business smarter
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
            Create your free partner account and connect your restaurant to Retrop RMS.
          </p>
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Zero setup fees', 'Real-time order tracking', 'Staff & inventory management', 'GST compliance & analytics'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0 }} />
                {f}
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Powering modern businesses nationwide.</div>
      </div>

      {/* Form side */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px, 4vh, 48px) 32px', overflowY: 'auto', position: 'relative' }}>
        {/* Top controls */}
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link to="/" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-border)', transition: 'all 0.2s ease' }}
            onMouseOver={e => { e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.borderColor = 'var(--color-border-strong)'; }}
            onMouseOut={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
          >
            ← Home
          </Link>
        </div>



        <div style={{ width: '100%', maxWidth: 360 }}>


          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <img src="/logo-corner-rounded.png" alt="" style={{ width: 36, height: 36, borderRadius: 10, margin: '0 auto 10px' }} />
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 4 }}>
              {step === 'email' && 'Create your account'}
              {step === 'otp'   && 'Verify your email'}
              {step === 'password' && 'Set your password'}
              {step === 'done' && 'All done!'}
            </h2>
            {step !== 'done' && (
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                {step === 'email' && 'Enter your details to get started'}
                {step === 'otp' && 'Check your inbox for the code'}
                {step === 'password' && 'Choose a strong password'}
              </p>
            )}
          </div>

          {step === 'email'    && <StepEmail onNext={(n, e) => { setName(n); setEmail(e); setStep('otp'); }} />}
          {step === 'otp'      && <StepOtp name={name} email={email} onNext={uid => { setUserId(uid); setStep('password'); }} onBack={() => setStep('email')} />}
          {step === 'password' && <StepPassword userId={userId} onDone={() => setStep('done')} />}
          {step === 'done'     && <StepSuccess />}

          {step !== 'done' && (
            <p style={{ fontSize: 11, color: 'var(--color-text-subtle)', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 700 }}>Sign In</Link>
            </p>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .login-page-grid { grid-template-columns: 1fr !important; }
          .login-page-grid > *:first-child { display: none !important; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}
