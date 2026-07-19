// ============================================================================
// HOME PAGE (/) — Business-focused, premium animations
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight, ChefHat, BarChart3, Zap, ShieldCheck,
  Globe, HeadphonesIcon, Star, CheckCircle2, Sparkles,
  TrendingUp, Cpu, Bot, LineChart, Layers, Users,
  CircleDot, ArrowUpRight
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageWrapper from '../components/PageWrapper';


// ── Scroll Reveal Hook ────────────────────────────────────────────────────────
// APPROACH: Progressive enhancement — elements start fully visible.
// JS adds [data-sr-active] to the container (which hides .sr elements via CSS)
// and starts the IntersectionObserver in the SAME synchronous call.
// This eliminates the race condition where elements are hidden but not yet observed.
function useScrollReveal(attr) {
  useEffect(() => {
    // PageWrapper has a 300ms skeleton delay. We wait for it + a paint frame.
    const timer = setTimeout(() => {
      const root = document.querySelector(`[data-sr-root="${attr}"]`);
      if (!root) return;

      // 1. Activate hidden state on all .sr elements
      root.setAttribute('data-sr-active', 'true');

      // 2. Immediately observe every element we just hid — no gap, no race
      const targets = root.querySelectorAll(
        '.sr, .sr-left, .sr-right, .sr-scale, .sr-blur'
      );

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        // threshold:0 fires as soon as 1px enters viewport — safest for mobile
        { threshold: 0 }
      );

      targets.forEach((el) => observer.observe(el));

      // Fallback: after 2s force-reveal any element that still hasn't been shown
      // (handles edge cases where IntersectionObserver misfires on some mobile browsers)
      const fallback = setTimeout(() => {
        root.querySelectorAll('.sr:not(.visible), .sr-left:not(.visible), .sr-right:not(.visible), .sr-scale:not(.visible), .sr-blur:not(.visible)').forEach(
          (el) => el.classList.add('visible')
        );
      }, 2000);

      return () => {
        observer.disconnect();
        clearTimeout(fallback);
      };
    }, 350);

    return () => clearTimeout(timer);
  }, [attr]);
}

// ── Animated Counter ──────────────────────────────────────────────────────────
function CountUp({ end, suffix = '', duration = 1800 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = end / (duration / 16);
        const tick = () => {
          start = Math.min(start + step, end);
          setVal(Math.round(start));
          if (start < end) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{val}{suffix}</span>;
}

// ── Hero Section ──────────────────────────────────────────────────────────────
function HeroSection() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { user, owner } = useAuth();
  const isLogged = Boolean(user || owner || localStorage.getItem('retrop_portal_token'));

  useEffect(() => {
    const onMove = (e) => setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <section className="hero-section">
      {/* Animated gradient blobs — parallax on mouse */}
      <div style={{
        position: 'absolute', borderRadius: '50%', filter: 'blur(90px)', pointerEvents: 'none',
        width: 440, height: 440, opacity: 0.45,
        background: 'radial-gradient(circle, rgba(255,107,53,0.18) 0%, transparent 70%)',
        top: `calc(10% + ${mousePos.y * 20}px)`,
        left: `calc(10% + ${mousePos.x * 20}px)`,
        transition: 'top 0.8s ease, left 0.8s ease',
      }} />
      <div style={{
        position: 'absolute', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none',
        width: 500, height: 500, opacity: 0.35,
        background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)',
        bottom: `calc(10% + ${mousePos.y * 15}px)`,
        right: `calc(5% + ${mousePos.x * 15}px)`,
        transition: 'bottom 0.8s ease, right 0.8s ease',
      }} />

      {/* Dot grid pattern */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.03,
        backgroundImage: 'radial-gradient(circle, var(--color-text) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      {/* Content — hero items animate in on page load (not scroll) */}
      <div className="hero-content" style={{ maxWidth: '780px', margin: '0 auto' }}>
        {/* Eyebrow badge */}
        <div
          className="hero-eyebrow hero-anim"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'var(--color-primary-light)',
            border: '1px solid rgba(255,107,53,0.2)',
            color: 'var(--color-primary)', fontSize: '12px', fontWeight: 700,
            padding: '6px 14px', borderRadius: '9999px',
            letterSpacing: '0.4px', textTransform: 'uppercase',
            marginBottom: '24px', animationDelay: '0.1s',
          }}
        >
          <Sparkles size={13} />
          Integrated Business Automation Platform
        </div>

        {/* Headline */}
        <h1
          className="hero-headline hero-anim"
          style={{
            fontSize: 'clamp(36px, 5.5vw, 68px)',
            fontWeight: 850,
            letterSpacing: '-2.2px',
            lineHeight: 1.08,
            marginBottom: '20px',
            animationDelay: '0.22s',
          }}
        >
          A smarter way to build & run{' '}
          <span style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #ff9248 50%, #6366f1 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            your business
          </span>
        </h1>

        {/* Sub-headline */}
        <p
          className="hero-sub hero-anim"
          style={{
            fontSize: 'clamp(16px,2.2vw,20px)',
            color: 'var(--color-text-muted)',
            maxWidth: '560px', margin: '0 auto 44px',
            lineHeight: 1.75,
            animationDelay: '0.34s',
          }}
        >
          Retrop gives businesses the tools to automate operations, digitalize workflows,
          and make smarter decisions — powered by intelligent, real-time data.
        </p>

        {/* CTAs */}
        <div
          className="hero-ctas hero-anim"
          style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            flexWrap: 'wrap', justifyContent: 'center',
            animationDelay: '0.46s',
          }}
        >
          {isLogged ? (
            <Link to="/dashboard"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '14px 28px', borderRadius: '14px',
                background: 'var(--color-primary)', color: '#fff',
                fontSize: '15px', fontWeight: 700, textDecoration: 'none',
                boxShadow: '0 8px 28px rgba(255,107,53,0.32)',
                transition: 'all 0.25s ease',
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(255,107,53,0.42)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(255,107,53,0.32)'; }}
            >
              Go to Dashboard <ArrowRight size={17} />
            </Link>
          ) : (
            <Link to="/services"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '14px 28px', borderRadius: '14px',
                background: 'var(--color-primary)', color: '#fff',
                fontSize: '15px', fontWeight: 700, textDecoration: 'none',
                boxShadow: '0 8px 28px rgba(255,107,53,0.32)',
                transition: 'all 0.25s ease',
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(255,107,53,0.42)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(255,107,53,0.32)'; }}
            >
              Explore Solutions <ArrowRight size={17} />
            </Link>
          )}
          <Link to="/docs"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 28px', borderRadius: '14px',
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              fontSize: '15px', fontWeight: 600, textDecoration: 'none',
              transition: 'all 0.25s ease',
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            View Documentation
          </Link>
        </div>

        {/* Trust indicators */}
        <div
          className="hero-anim"
          style={{
            marginTop: '56px',
            display: 'flex', alignItems: 'center', gap: '24px',
            flexWrap: 'wrap', justifyContent: 'center',
            animationDelay: '0.58s',
          }}
        >
          {[
            { icon: CheckCircle2, label: 'Setup in minutes' },
            { icon: ShieldCheck, label: 'Secure by default' },
            { icon: HeadphonesIcon, label: 'Dedicated support' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              <Icon size={14} color="var(--color-success)" /> {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── What We Do ────────────────────────────────────────────────────────────────
function WhatWeDoSection() {
  const items = [
    {
      icon: Bot,
      title: 'Automate Operations',
      desc: 'Replace manual, repetitive tasks with intelligent automation. Let software handle the grind so your team focuses on what creates real value.',
      color: '#FF6B35',
    },
    {
      icon: Cpu,
      title: 'Digitalize Workflows',
      desc: 'Move from paper and spreadsheets to a fully digital, real-time system. Every process — tracked, measurable, and improvable.',
      color: '#6366f1',
    },
    {
      icon: LineChart,
      title: 'AI-Powered Insights',
      desc: 'Turn raw operational data into actionable decisions. Understand your margins, identify inefficiencies, and forecast with confidence.',
      color: '#10b981',
    },
  ];

  return (
    <section className="section section-alt">
      <div className="container">
        <div className="section-header">
          <span className="badge badge-primary sr" style={{ marginBottom: '16px' }}>What We Do</span>
          <h2 className="sr" style={{ transitionDelay: '0.1s' }}>We help businesses grow smarter</h2>
          <p className="sr" style={{ transitionDelay: '0.15s' }}>
            Retrop builds intelligent software that helps modern businesses automate the routine,
            understand their operations, and scale without chaos.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '24px' }}>
          {items.map(({ icon: Icon, title, desc, color }, i) => (
            <div
              key={title}
              className="sr"
              style={{
                padding: '32px', borderRadius: '20px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                transition: 'transform 0.35s ease, box-shadow 0.35s ease, opacity 0.65s cubic-bezier(0.22,1,0.36,1)',
                transitionDelay: `${0.05 + i * 0.12}s`,
                cursor: 'default',
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-xl)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ width: 52, height: 52, borderRadius: '14px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, marginBottom: '20px', transition: 'all 0.3s ease' }}>
                <Icon size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px', marginBottom: '10px' }}>{title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.75 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Services / Products ───────────────────────────────────────────────────────
function ServicesSection() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <span className="badge badge-primary sr">Our Solutions</span>
          <h2 className="sr" style={{ transitionDelay: '0.1s' }}>Built for businesses that mean business</h2>
          <p className="sr" style={{ transitionDelay: '0.15s' }}>
            A growing ecosystem of intelligent software tools to power every layer of your operations.
          </p>
        </div>

        {/* RMS featured card */}
        <div
          className="sr"
          style={{
            border: '1.5px solid rgba(255,107,53,0.25)', borderRadius: '24px',
            padding: '40px', background: 'var(--color-surface)',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 0 0 1px rgba(255,107,53,0.06), var(--shadow-md)',
            transition: 'transform 0.35s ease, box-shadow 0.35s ease, opacity 0.65s cubic-bezier(0.22,1,0.36,1)',
          }}
          onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(255,107,53,0.12), var(--shadow-xl)'; }}
          onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(255,107,53,0.06), var(--shadow-md)'; }}
        >
          {/* Top gradient bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg,#FF6B35,#FF9A3C)' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '16px', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                <ChefHat size={26} />
              </div>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '2px' }}>Retrop RMS</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600, margin: 0 }}>Restaurant Management System</p>
              </div>
            </div>
            <span className="badge badge-success">Live Now</span>
          </div>

          <p style={{ fontSize: '16px', color: 'var(--color-text-muted)', lineHeight: 1.8, marginBottom: '28px', maxWidth: '680px' }}>
            Retrop RMS is the flagship automation platform — combining inventory management, ordering systems,
            cost analytics, staff coordination, and owner-level insights into one cohesive, powerful tool.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '10px', marginBottom: '32px' }}>
            {['Real-time inventory tracking', 'Automated cost calculations', 'Digital ordering system', 'Staff & role management', 'Vendor & purchase orders', 'Analytics dashboard'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                <CheckCircle2 size={14} color="var(--color-primary)" style={{ flexShrink: 0 }} /> {f}
              </div>
            ))}
          </div>

          <Link to="/services"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: '0 6px 20px rgba(255,107,53,0.28)', transition: 'all 0.2s ease' }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(255,107,53,0.38)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,107,53,0.28)'; }}
          >
            Learn More <ArrowRight size={15} />
          </Link>
        </div>

        {/* Coming soon hint */}
        <div
          className="sr"
          style={{ marginTop: '24px', padding: '24px 28px', borderRadius: '16px', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', transitionDelay: '0.15s' }}
        >
          <Layers size={18} color="var(--color-text-muted)" />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', fontWeight: 600, margin: 0, marginBottom: '2px' }}>More solutions on the way</p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>POS, Analytics, and more — coming soon as part of the Retrop ecosystem.</p>
          </div>
          <Link to="/services" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            See roadmap <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Why Choose Us ─────────────────────────────────────────────────────────────
function WhySection() {
  const reasons = [
    { icon: Zap, title: 'Blazing Fast', desc: 'Optimised for speed from day one. Your team won\'t wait around for software to catch up.' },
    { icon: ShieldCheck, title: 'Secure by Design', desc: 'Bank-grade encryption, role-based access, and regular audits keep your data protected.' },
    { icon: Globe, title: 'Works Everywhere', desc: 'Fully responsive — phone, tablet, or desktop. Your team stays connected from any device.' },
    { icon: HeadphonesIcon, title: 'Real Human Support', desc: 'No chatbots. Get a dedicated specialist who understands your business setup.' },
    { icon: Star, title: 'Built for India', desc: 'GST-ready, INR pricing, local integrations, and support for Indian business complexity.' },
    { icon: Users, title: 'Team-First Design', desc: 'Minimal training, maximum adoption. Built with real teams in real-world workflows.' },
  ];

  return (
    <section className="section section-alt">
      <div className="container">
        <div className="section-header">
          <span className="badge badge-primary sr">Why Choose Us</span>
          <h2 className="sr" style={{ transitionDelay: '0.1s' }}>Software that gets out of your way</h2>
          <p className="sr" style={{ transitionDelay: '0.15s' }}>
            Not a generic SaaS tool with a new label. Every feature was designed for the real challenges
            that modern businesses face every day.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '24px' }}>
          {reasons.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className="sr"
              style={{
                display: 'flex', flexDirection: 'column', gap: '12px',
                padding: '24px', borderRadius: '16px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                transition: 'transform 0.35s ease, box-shadow 0.35s ease, opacity 0.65s cubic-bezier(0.22,1,0.36,1)',
                transitionDelay: `${i * 0.08}s`,
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                <Icon size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.75 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How We Work ───────────────────────────────────────────────────────────────
function HowSection() {
  const steps = [
    { n: '01', title: 'Onboard', desc: 'Quick account setup with guided onboarding. No technical expertise needed.' },
    { n: '02', title: 'Configure', desc: 'Set up your workflows, teams, and data in under an hour with our setup wizard.' },
    { n: '03', title: 'Go Live', desc: 'Deploy your automated systems. Real-time tracking begins from day one.' },
    { n: '04', title: 'Scale', desc: 'Use insights and reports to cut costs, improve margins, and grow confidently.' },
  ];

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <span className="badge badge-primary sr">How It Works</span>
          <h2 className="sr" style={{ transitionDelay: '0.1s' }}>Up and running in one day</h2>
          <p className="sr" style={{ transitionDelay: '0.15s' }}>No technical team. No weeks of training. Simple, guided, and fast.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0', position: 'relative' }}>
          {steps.map(({ n, title, desc }, i) => (
            <div
              key={n}
              className="sr"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 24px', position: 'relative', zIndex: 1, transitionDelay: `${i * 0.12}s` }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'var(--color-surface)',
                border: '2px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)',
                marginBottom: '20px', position: 'relative', zIndex: 1,
                transition: 'all 0.3s ease',
                boxShadow: 'var(--shadow-sm)',
              }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'var(--color-primary-light)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {n}
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>{title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA Band ──────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="cta-band">
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.08) 0%, transparent 60%), radial-gradient(circle at 70% 50%, rgba(0,0,0,0.06) 0%, transparent 60%)' }} />
      <div className="cta-band-inner sr-scale" style={{ position: 'relative', zIndex: 1, maxWidth: '640px', margin: '0 auto' }}>
        <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: '#fff', letterSpacing: '-1.5px', marginBottom: '16px' }}>
          Ready to modernize your business?
        </h2>
        <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.8)', marginBottom: '36px', lineHeight: 1.7 }}>
          Join businesses using Retrop to automate operations, cut costs, and grow with confidence.
        </p>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/contact"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '14px', background: '#fff', color: 'var(--color-primary)', fontWeight: 700, fontSize: '15px', textDecoration: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', transition: 'all 0.25s ease' }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 32px rgba(0,0,0,0.2)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'; }}
          >
            Get in Touch <ArrowRight size={17} />
          </Link>
          <Link to="/services"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '14px', border: '1.5px solid rgba(255,255,255,0.45)', background: 'transparent', color: '#fff', fontWeight: 600, fontSize: '15px', textDecoration: 'none', transition: 'all 0.25s ease' }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.8)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)'; }}
          >
            See All Solutions
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function Home() {
  // Delay matches PageWrapper's 300ms skeleton + buffer
  useScrollReveal('home');



  return (
    <PageWrapper title="Home">
      {/*
        Scroll-reveal CSS — scoped to the Home page.
        ─────────────────────────────────────────────
        .sr        → fade-in + slide up   (default)
        .sr-left   → fade-in + slide from left
        .sr-right  → fade-in + slide from right
        .sr-scale  → fade-in + scale up from 94%
        .sr-blur   → fade-in + blur clear

        Each variant starts hidden; IntersectionObserver adds ".visible"
        once the element crosses into the viewport.
      */}
      <style>{`
        /*
         * PROGRESSIVE ENHANCEMENT approach:
         * .sr elements are VISIBLE by default.
         * They only become hidden once JS adds [data-sr-active] to their
         * parent container. The observer is started in the same synchronous
         * call, so there is never a moment elements are hidden without being
         * observed. This eliminates blank-page race conditions on mobile.
         */

        /* ── Hidden states (only active when JS has run) ───── */
        [data-sr-active] .sr {
          opacity: 0;
          transform: translateY(36px);
          transition: opacity 0.65s cubic-bezier(0.22,1,0.36,1),
                      transform 0.65s cubic-bezier(0.22,1,0.36,1);
          will-change: opacity, transform;
        }
        [data-sr-active] .sr-left {
          opacity: 0;
          transform: translateX(-48px);
          transition: opacity 0.65s cubic-bezier(0.22,1,0.36,1),
                      transform 0.65s cubic-bezier(0.22,1,0.36,1);
          will-change: opacity, transform;
        }
        [data-sr-active] .sr-right {
          opacity: 0;
          transform: translateX(48px);
          transition: opacity 0.65s cubic-bezier(0.22,1,0.36,1),
                      transform 0.65s cubic-bezier(0.22,1,0.36,1);
          will-change: opacity, transform;
        }
        [data-sr-active] .sr-scale {
          opacity: 0;
          transform: scale(0.94);
          transition: opacity 0.65s cubic-bezier(0.22,1,0.36,1),
                      transform 0.65s cubic-bezier(0.22,1,0.36,1);
          will-change: opacity, transform;
        }
        [data-sr-active] .sr-blur {
          opacity: 0;
          filter: blur(8px);
          transition: opacity 0.7s ease, filter 0.7s ease;
          will-change: opacity, filter;
        }

        /* ── Visible states ────────────────────────────────── */
        [data-sr-active] .sr.visible,
        [data-sr-active] .sr-left.visible,
        [data-sr-active] .sr-right.visible,
        [data-sr-active] .sr-scale.visible {
          opacity: 1;
          transform: none;
        }
        [data-sr-active] .sr-blur.visible {
          opacity: 1;
          filter: blur(0);
        }

        /* ── Hero load-in animation ────────────────────────── */
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-anim {
          opacity: 0;
          animation: heroFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) forwards;
        }

        /* ── Floating pulse on hero badge ──────────────────── */
        @keyframes subtleFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }
        .hero-eyebrow.hero-anim {
          animation: heroFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s forwards,
                     subtleFloat 3.5s ease-in-out 1s infinite;
        }
      `}</style>

      {/* data-sr-root lets useScrollReveal find elements after PageWrapper mounts */}
      <div data-sr-root="home">
        <Navbar />
        <HeroSection />
        <WhatWeDoSection />
        <ServicesSection />
        <WhySection />
        <HowSection />
        <CTASection />
        <Footer />
      </div>
    </PageWrapper>
  );
}
