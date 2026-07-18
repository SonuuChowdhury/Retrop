// ============================================================================
// FORGOT PASSWORD PAGE (/forgot-password) — OTP → new password
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Eye, EyeOff, ArrowLeft, CheckCircle2, Mail, Lock, AlertCircle, Sun, Moon } from 'lucide-react';

// ── OTP Input (same as in Signup) ───────────────────────────────────────────
function OtpInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = value.split('');

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !e.target.value && i > 0) inputs.current[i - 1]?.focus();
  };

  const handleChange = (i, e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) { const next = [...digits]; next[i] = ''; onChange(next.join('')); return; }
    if (raw.length > 1) {
      const pasted = raw.slice(0, 6).split('');
      const next = Array(6).fill('');
      pasted.forEach((ch, idx) => { if (idx < 6) next[idx] = ch; });
      onChange(next.join(''));
      inputs.current[Math.min(pasted.length, 5)]?.focus();
      return;
    }
    const next = [...digits]; next[i] = raw[0]; onChange(next.join(''));
    if (i < 5) inputs.current[i + 1]?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {Array(6).fill('').map((_, i) => (
        <input key={i} ref={el => (inputs.current[i] = el)} type="text" inputMode="numeric" maxLength={6}
          value={digits[i] || ''} onChange={e => handleChange(i, e)} onKeyDown={e => handleKey(i, e)}
          style={{ width: 44, height: 52, textAlign: 'center', fontSize: 22, fontWeight: 800, border: `2px solid ${digits[i] ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: 10, background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', fontFamily: 'monospace', transition: 'border-color 0.15s' }}
        />
      ))}
    </div>
  );
}

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

export default function ForgotPassword() {
  const { theme, toggleTheme } = useAuth();
  const navigate = useNavigate();

  const [step,       setStep]       = useState('email');  // email → otp → password → done
  const [email,      setEmail]      = useState('');
  const [otp,        setOtp]        = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPwd,     setNewPwd]     = useState('');
  const [confPwd,    setConfPwd]    = useState('');
  const [showPwd,    setShowPwd]    = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [resendIn,   setResendIn]   = useState(0);

  const strength = getPasswordStrength(newPwd);

  useEffect(() => { document.title = 'Reset Password — Retrop'; }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handleEmailSubmit = async e => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address'); return;
    }
    setError(''); setLoading(true);
    try {
      const res = await api.portalRequestForgotOtp(email.trim());
      if (res.success) { setStep('otp'); setResendIn(60); }
      else setError(res.message || 'Failed to send OTP');
    } catch (e) { setError(e.message || 'Connection error'); }
    finally { setLoading(false); }
  };

  const handleOtpSubmit = async e => {
    e.preventDefault();
    if (otp.length < 6) { setError('Enter all 6 digits'); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.portalVerifyForgotOtp(email, otp);
      if (res.success && res.data?.resetToken) { setResetToken(res.data.resetToken); setStep('password'); }
      else setError(res.message || 'Invalid OTP');
    } catch (e) { setError(e.message || 'Connection error'); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    try { await api.portalRequestForgotOtp(email); setResendIn(60); setOtp(''); setError(''); } catch {}
  };

  const handlePasswordSubmit = async e => {
    e.preventDefault();
    if (!newPwd || newPwd.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(newPwd)) { setError('Must include an uppercase letter'); return; }
    if (!/[0-9]/.test(newPwd)) { setError('Must include a number'); return; }
    if (newPwd !== confPwd) { setError('Passwords do not match'); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.portalResetPassword(resetToken, newPwd);
      if (res.success) { setStep('done'); setTimeout(() => navigate('/login', { state: { message: 'Password reset! Please sign in.' } }), 2500); }
      else setError(res.message || 'Failed to reset password');
    } catch (e) { setError(e.message || 'Connection error'); }
    finally { setLoading(false); }
  };

  const ErrorBanner = ({ msg }) => msg ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid #ef4444', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#ef4444' }}>
      <AlertCircle size={14} /> {msg}
    </div>
  ) : null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: '24px 16px', position: 'relative' }}>
      {/* Top Controls */}
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
        <Link to="/login" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
          <ArrowLeft size={12} /> Sign In
        </Link>
      </div>


      <div style={{ width: '100%', maxWidth: 400, animation: 'fadeInUp 0.35s ease both' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/logo-corner-rounded.png" alt="Retrop" style={{ width: 44, height: 44, borderRadius: 12, margin: '0 auto 12px' }} />
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 4 }}>
            {step === 'done' ? 'Password Reset!' : 'Forgot Password'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            {step === 'email' && "We'll send you a code to reset your password"}
            {step === 'otp'   && `Code sent to ${email}`}
            {step === 'password' && 'Set your new password'}
            {step === 'done' && 'Redirecting you to sign in...'}
          </p>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '28px 24px', boxShadow: 'var(--shadow-md)' }}>
          {/* Step: Email */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} noValidate>
              <ErrorBanner msg={error} />
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--color-text-muted)' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input type="email" className="form-input" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} disabled={loading} autoFocus
                    style={{ paddingLeft: 36, fontSize: 14 }} />
                </div>
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, borderRadius: 10, background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? <><span className="spinner animate-spin" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#fff' }} /> Sending...</> : 'Send Reset Code →'}
              </button>
            </form>
          )}

          {/* Step: OTP */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} noValidate>
              <button type="button" onClick={() => setStep('email')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: 0, marginBottom: 16 }}>
                <ArrowLeft size={13} /> Change email
              </button>
              <ErrorBanner msg={error} />
              <div style={{ marginBottom: 20 }}>
                <OtpInput value={otp} onChange={setOtp} />
              </div>
              <button type="submit" disabled={loading || otp.length < 6} style={{ width: '100%', padding: 12, borderRadius: 10, background: otp.length === 6 ? 'var(--color-primary)' : 'var(--color-bg-subtle)', color: otp.length === 6 ? '#fff' : 'var(--color-text-muted)', fontWeight: 700, fontSize: 14, border: 'none', cursor: otp.length === 6 ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? <><span className="spinner animate-spin" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: 'currentColor' }} /> Verifying...</> : 'Verify Code →'}
              </button>
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)', marginTop: 12 }}>
                {resendIn > 0 ? <>Resend in <strong>{resendIn}s</strong></> : <button type="button" onClick={handleResend} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>Resend Code</button>}
              </p>
            </form>
          )}

          {/* Step: New Password */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} noValidate>
              <ErrorBanner msg={error} />
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--color-text-muted)' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input type={showPwd ? 'text' : 'password'} className="form-input" placeholder="Minimum 8 characters"
                    value={newPwd} onChange={e => setNewPwd(e.target.value)} disabled={loading}
                    style={{ paddingLeft: 36, paddingRight: 40, fontSize: 14 }} />
                  <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4 }}>
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {newPwd && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ height: 3, borderRadius: 3, background: 'var(--color-border)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(strength.score / 5) * 100}%`, background: strength.color, transition: 'all 0.3s', borderRadius: 3 }} />
                    </div>
                    <p style={{ fontSize: 11, color: strength.color, marginTop: 3, fontWeight: 600 }}>{strength.label}</p>
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--color-text-muted)' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input type={showConf ? 'text' : 'password'} className="form-input" placeholder="Repeat your new password"
                    value={confPwd} onChange={e => setConfPwd(e.target.value)} disabled={loading}
                    style={{ paddingLeft: 36, paddingRight: 40, fontSize: 14 }} />
                  <button type="button" onClick={() => setShowConf(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4 }}>
                    {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, borderRadius: 10, background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? <><span className="spinner animate-spin" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#fff' }} /> Resetting...</> : 'Reset Password →'}
              </button>
            </form>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: 56, height: 56, background: 'rgba(34,197,94,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#22c55e' }}>
                <CheckCircle2 size={28} />
              </div>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Redirecting to sign in...</p>
            </div>
          )}
        </div>

        <p style={{ fontSize: 11, color: 'var(--color-text-subtle)', textAlign: 'center', marginTop: 16 }}>
          Remembered your password?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 700 }}>Sign In</Link>
        </p>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
