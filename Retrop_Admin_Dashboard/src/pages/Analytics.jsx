// ============================================================================
// RETROP ADMIN — COMPREHENSIVE ANALYTICS & USER LOGIN TELEMETRY DASHBOARD
// ============================================================================

import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../services/api';
import {
  Users, UserCheck, Clock, TrendingUp, RefreshCw, Smartphone, Monitor,
  Globe, Shield, Eye, ArrowUpRight, Award, Compass, Laptop, Zap,
  Search, Filter, CheckCircle2, XCircle, Key, Mail, Phone, Building2,
  Activity, ChevronRight, ExternalLink, Lock, ShieldCheck, UserX,
  Calendar, X, Layers, LayoutGrid, ListFilter
} from 'lucide-react';

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'website'
  const [activeSubSection, setActiveSubSection] = useState('users'); // 'users' | 'audit'
  const [userViewMode, setUserViewMode] = useState('cards'); // 'cards' | 'table'

  const [data, setData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [authFilter, setAuthFilter] = useState('all');
  const [businessFilter, setBusinessFilter] = useState('all');

  // Modal for User Session Detail
  const [selectedUserForModal, setSelectedUserForModal] = useState(null);

  const fetchAnalytics = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Fetch both general analytics summary and user analytics summary
      const [websiteRes, userRes] = await Promise.allSettled([
        api.getWebsiteAnalytics(),
        api.getUserAnalytics()
      ]);

      if (websiteRes.status === 'fulfilled' && websiteRes.value?.data) {
        setData(websiteRes.value.data);
        if (websiteRes.value.data.userAnalytics) {
          setUserData(websiteRes.value.data.userAnalytics);
        }
      }

      if (userRes.status === 'fulfilled' && userRes.value?.data?.data) {
        setUserData(userRes.value.data.data);
      }
    } catch (err) {
      setError(err.message || 'Server error loading analytics telemetry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(() => fetchAnalytics(true), 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Format seconds into "2m 14s"
  const formatDuration = (sec = 0) => {
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  // Format ISO timestamp to readable date-time string
  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  // Format ISO timestamp to relative time (e.g., "5 mins ago", "2 hours ago")
  const formatRelativeTime = (isoString) => {
    if (!isoString) return 'Never';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'Never';
      const now = new Date();
      const diffMs = now - d;
      const diffSec = Math.floor(diffMs / 1000);

      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDay = Math.floor(diffHr / 24);
      if (diffDay < 30) return `${diffDay}d ago`;
      return formatDate(isoString);
    } catch {
      return isoString;
    }
  };

  if (loading && !data && !userData) {
    return (
      <Layout>
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <div className="spinner animate-spin" style={{ width: 36, height: 36, margin: '80px auto', borderWidth: 3, borderColor: 'var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: 600 }}>Loading real-time portal & traffic analytics...</p>
        </div>
      </Layout>
    );
  }

  const summary = data || {
    totalVisitors: 0,
    uniqueVisitors: 0,
    returningVisitors: 0,
    avgSessionDurationSeconds: 0,
    bounceRatePercent: 0,
    pagesVisited: {},
    deviceTypes: {},
    browsers: {},
    operatingSystems: {},
    trafficSources: {},
    countries: {},
    cities: {},
    lastUpdated: 'Just now'
  };

  const userMetrics = userData?.userMetrics || userData?.metrics || {
    totalUsers: 0,
    verifiedUsers: 0,
    googleUsers: 0,
    emailUsers: 0,
    activeUsers: 0,
    pendingPasswordUsers: 0,
    totalActiveSessions: 0
  };

  const usersList = userData?.users || [];
  const loginAuditTrail = userData?.loginAuditTrail || [];

  // Filter Users
  const filteredUsers = usersList.filter(u => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query ||
      (u.name || '').toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query) ||
      (u.mobile || '').includes(query) ||
      (u.businesses || []).some(b => (b.businessName || '').toLowerCase().includes(query));

    const matchesVerification =
      verificationFilter === 'all' ? true :
      verificationFilter === 'verified' ? u.emailVerified :
      !u.emailVerified;

    const matchesAuth =
      authFilter === 'all' ? true :
      authFilter === 'google' ? !!u.googleId :
      !u.googleId;

    const matchesBusiness =
      businessFilter === 'all' ? true :
      businessFilter === 'has_business' ? (u.businesses && u.businesses.length > 0) :
      (!u.businesses || u.businesses.length === 0);

    return matchesSearch && matchesVerification && matchesAuth && matchesBusiness;
  });

  // Website breakdown computations
  const sortedPages = Object.entries(summary.pagesVisited || {}).sort((a, b) => b[1] - a[1]);
  const sortedSources = Object.entries(summary.trafficSources || {}).sort((a, b) => b[1] - a[1]);
  const sortedDevices = Object.entries(summary.deviceTypes || {}).sort((a, b) => b[1] - a[1]);
  const sortedBrowsers = Object.entries(summary.browsers || {}).sort((a, b) => b[1] - a[1]);
  const sortedOS = Object.entries(summary.operatingSystems || {}).sort((a, b) => b[1] - a[1]);
  const sortedCities = Object.entries(summary.cities || {}).sort((a, b) => b[1] - a[1]);
  const totalHits = summary.totalVisitors || 1;

  // Clean last updated timestamp string
  const cleanUpdatedTime = formatRelativeTime(summary.lastUpdated);

  return (
    <Layout>
      <div style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>

        {/* Header Title & Refresh Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.5px' }}>
                Analytics & User Telemetry
              </h1>
              <span className="badge badge-primary" style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 700, borderRadius: '20px', background: 'rgba(255,107,53,0.12)', color: 'var(--color-primary)' }}>
                Live Stream
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
              Real-time portal accounts telemetry, login activity history, and website traffic statistics.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-subtle)', background: 'var(--color-surface)', padding: '6px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', fontWeight: 600 }}>
              Updated: {cleanUpdatedTime}
            </span>
            <button
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '12px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '14px 18px', background: 'rgba(230,57,70,0.08)', border: '1px solid #e63946', borderRadius: '12px', color: '#e63946', marginBottom: '24px', fontSize: '14px', fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Main Tab Navigation Bar ───────────────────────────────────────── */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '28px', gap: '8px', overflowX: 'auto' }}>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '12px 20px',
              fontSize: '15px',
              fontWeight: 700,
              color: activeTab === 'users' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              background: activeTab === 'users' ? 'rgba(255,107,53,0.08)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'users' ? '3px solid var(--color-primary)' : '3px solid transparent',
              borderRadius: '10px 10px 0 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Users size={18} /> User Accounts & Logins
            <span style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              background: activeTab === 'users' ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
              color: activeTab === 'users' ? '#fff' : 'var(--color-text-muted)',
              fontWeight: 700
            }}>
              {userMetrics.totalUsers || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('website')}
            style={{
              padding: '12px 20px',
              fontSize: '15px',
              fontWeight: 700,
              color: activeTab === 'website' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              background: activeTab === 'website' ? 'rgba(255,107,53,0.08)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'website' ? '3px solid var(--color-primary)' : '3px solid transparent',
              borderRadius: '10px 10px 0 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Globe size={18} /> Website & Traffic Telemetry
            <span style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              background: activeTab === 'website' ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
              color: activeTab === 'website' ? '#fff' : 'var(--color-text-muted)',
              fontWeight: 700
            }}>
              {summary.totalVisitors || 0} Hits
            </span>
          </button>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: USER ACCOUNTS & LOGIN HISTORY TELEMETRY */}
        {/* =================================================================== */}
        {activeTab === 'users' && (
          <div>
            {/* 1. User Metrics KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '18px', marginBottom: '28px' }}>
              
              {/* Card 1: Total Registered Users */}
              <div style={{ padding: '20px', borderRadius: '18px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)' }}>Total Portal Users</span>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(255,107,53,0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
                  {userMetrics.totalUsers || 0}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-subtle)', marginTop: '4px', display: 'block' }}>
                  {userMetrics.activeUsers || 0} active accounts
                </span>
              </div>

              {/* Card 2: Email Verified Users */}
              <div style={{ padding: '20px', borderRadius: '18px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)' }}>Email Verified</span>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(46,196,182,0.1)', color: '#2ec4b6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserCheck size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
                  {userMetrics.verifiedUsers || 0}
                </div>
                <span style={{ fontSize: '12px', color: '#2ec4b6', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                  {userMetrics.totalUsers ? Math.round((userMetrics.verifiedUsers / userMetrics.totalUsers) * 100) : 0}% verification rate
                </span>
              </div>

              {/* Card 3: Auth Provider Breakdown */}
              <div style={{ padding: '20px', borderRadius: '18px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)' }}>Auth Providers</span>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
                  {userMetrics.googleUsers || 0} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Google</span> / {userMetrics.emailUsers || 0} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Pass</span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-subtle)', marginTop: '4px', display: 'block' }}>
                  {userMetrics.pendingPasswordUsers || 0} pending initial password
                </span>
              </div>

              {/* Card 4: Active Login Sessions */}
              <div style={{ padding: '20px', borderRadius: '18px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)' }}>Active JWT Sessions</span>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
                  {userMetrics.totalActiveSessions || 0}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-subtle)', marginTop: '4px', display: 'block' }}>
                  Currently active user logins
                </span>
              </div>

            </div>

            {/* ── Section Selector & Search / Filter Bar ────────────────────────────── */}
            <div style={{ background: 'var(--color-surface)', borderRadius: '20px', border: '1px solid var(--color-border)', padding: '20px', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                
                {/* View Selector Buttons */}
                <div style={{ display: 'flex', background: 'var(--color-bg-subtle)', padding: '4px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                  <button
                    onClick={() => setActiveSubSection('users')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      border: 'none',
                      background: activeSubSection === 'users' ? 'var(--color-surface)' : 'transparent',
                      color: activeSubSection === 'users' ? 'var(--color-text)' : 'var(--color-text-muted)',
                      cursor: 'pointer',
                      boxShadow: activeSubSection === 'users' ? 'var(--shadow-sm)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Users size={15} /> Registered Users ({filteredUsers.length})
                  </button>

                  <button
                    onClick={() => setActiveSubSection('audit')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      border: 'none',
                      background: activeSubSection === 'audit' ? 'var(--color-surface)' : 'transparent',
                      color: activeSubSection === 'audit' ? 'var(--color-text)' : 'var(--color-text-muted)',
                      cursor: 'pointer',
                      boxShadow: activeSubSection === 'audit' ? 'var(--shadow-sm)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Clock size={15} /> Login Audit Log ({loginAuditTrail.length})
                  </button>
                </div>

                {/* Grid vs Table Layout Toggle (for Users View) */}
                {activeSubSection === 'users' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-bg-subtle)', padding: '3px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                    <button
                      onClick={() => setUserViewMode('cards')}
                      title="Card Grid View"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '7px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: 'none',
                        background: userViewMode === 'cards' ? 'var(--color-surface)' : 'transparent',
                        color: userViewMode === 'cards' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <LayoutGrid size={14} /> Cards
                    </button>

                    <button
                      onClick={() => setUserViewMode('table')}
                      title="Table List View"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '7px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: 'none',
                        background: userViewMode === 'table' ? 'var(--color-surface)' : 'transparent',
                        color: userViewMode === 'table' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <ListFilter size={14} /> Table
                    </button>
                  </div>
                )}

              </div>

              {/* Search & Select Filters Row */}
              {activeSubSection === 'users' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  
                  {/* Search Bar */}
                  <div style={{ position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search user name, email, mobile, business..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 38px',
                        borderRadius: '12px',
                        background: 'var(--color-bg-subtle)',
                        border: '1px solid var(--color-border)',
                        color: '#ffffff',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    {searchQuery && (
                      <X size={14} onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--color-text-muted)' }} />
                    )}
                  </div>

                  {/* Verification Filter Dropdown */}
                  <div>
                    <select
                      value={verificationFilter}
                      onChange={(e) => setVerificationFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: 'var(--color-bg-subtle)',
                        border: '1px solid var(--color-border)',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 600,
                        outline: 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="all" style={{ background: '#1e293b', color: '#ffffff' }}>Filter: All Verifications</option>
                      <option value="verified" style={{ background: '#1e293b', color: '#ffffff' }}>Email Verified Only</option>
                      <option value="unverified" style={{ background: '#1e293b', color: '#ffffff' }}>Unverified Email Only</option>
                    </select>
                  </div>

                  {/* Auth Provider Dropdown */}
                  <div>
                    <select
                      value={authFilter}
                      onChange={(e) => setAuthFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: 'var(--color-bg-subtle)',
                        border: '1px solid var(--color-border)',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 600,
                        outline: 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="all" style={{ background: '#1e293b', color: '#ffffff' }}>Filter: All Auth Providers</option>
                      <option value="google" style={{ background: '#1e293b', color: '#ffffff' }}>Google OAuth Only</option>
                      <option value="password" style={{ background: '#1e293b', color: '#ffffff' }}>Email / Password Only</option>
                    </select>
                  </div>

                  {/* Linked Business Filter */}
                  <div>
                    <select
                      value={businessFilter}
                      onChange={(e) => setBusinessFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: 'var(--color-bg-subtle)',
                        border: '1px solid var(--color-border)',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 600,
                        outline: 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="all" style={{ background: '#1e293b', color: '#ffffff' }}>Filter: All Businesses</option>
                      <option value="has_business" style={{ background: '#1e293b', color: '#ffffff' }}>Has Linked Business</option>
                      <option value="no_business" style={{ background: '#1e293b', color: '#ffffff' }}>No Linked Business</option>
                    </select>
                  </div>

                </div>
              )}

            </div>

            {/* ── VIEW A: CARDS GRID VIEW (MODERN & RESPONSIVE) ───────────────── */}
            {activeSubSection === 'users' && userViewMode === 'cards' && (
              <div>
                {filteredUsers.length === 0 ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--color-surface)', borderRadius: '20px', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                    <UserX size={42} style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>No Portal Users Found</h3>
                    <p style={{ fontSize: '13.5px', margin: '4px 0 0' }}>Try broadening your search term or resetting active filters.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                    {filteredUsers.map((u) => {
                      const initial = (u.name || u.email || 'U').charAt(0).toUpperCase();
                      return (
                        <div
                          key={u.userId}
                          style={{
                            background: 'var(--color-surface)',
                            borderRadius: '20px',
                            border: '1px solid var(--color-border)',
                            padding: '22px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: 'var(--shadow-sm)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            position: 'relative'
                          }}
                        >
                          <div>
                            {/* Card Top Header: Avatar + User Info */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                              <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: '16px',
                                background: u.googleId ? 'linear-gradient(135deg, #4285F4, #34A853)' : 'linear-gradient(135deg, var(--color-primary), #ff9f1c)',
                                color: '#fff',
                                fontWeight: 800,
                                fontSize: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                              }}>
                                {initial}
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {u.name}
                                  </h3>
                                  {u.googleId ? (
                                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: 'rgba(66,133,244,0.12)', color: '#4285F4', fontWeight: 700, flexShrink: 0 }}>
                                      Google
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: 'rgba(255,107,53,0.12)', color: 'var(--color-primary)', fontWeight: 700, flexShrink: 0 }}>
                                      Password
                                    </span>
                                  )}
                                </div>

                                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  <Mail size={13} style={{ flexShrink: 0 }} /> {u.email}
                                </div>
                              </div>
                            </div>

                            {/* Contact & Status Badges */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                              <div style={{ fontSize: '12.5px', color: 'var(--color-text)', fontWeight: 600, background: 'var(--color-bg-subtle)', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <Phone size={12} color="var(--color-text-muted)" /> {u.mobile || 'No Mobile'}
                              </div>

                              {u.emailVerified ? (
                                <span style={{ fontSize: '11.5px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(46,196,182,0.12)', color: '#2ec4b6', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle2 size={12} /> Verified
                                </span>
                              ) : (
                                <span style={{ fontSize: '11.5px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(230,57,70,0.12)', color: '#e63946', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <XCircle size={12} /> Unverified
                                </span>
                              )}

                              {u.needsPasswordReset && (
                                <span style={{ fontSize: '11.5px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(245,158,11,0.12)', color: '#b45309', fontWeight: 700 }}>
                                  Reset Pending
                                </span>
                              )}
                            </div>

                            {/* Linked Businesses Box */}
                            <div style={{ background: 'var(--color-bg-subtle)', padding: '12px 14px', borderRadius: '14px', border: '1px solid var(--color-border)', marginBottom: '16px' }}>
                              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                                Linked Business ({u.businesses?.length || 0})
                              </span>

                              {!u.businesses || u.businesses.length === 0 ? (
                                <span style={{ fontSize: '12.5px', color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>
                                  No SaaS business attached
                                </span>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {u.businesses.map((b, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                                      <span style={{ fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Building2 size={13} color="var(--color-primary)" /> {b.businessName}
                                      </span>
                                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', textTransform: 'capitalize', fontWeight: 600 }}>
                                        {b.role || 'Owner'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Footer Row: Login Details & Action Button */}
                          <div style={{ paddingTop: '12px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-subtle)', display: 'block' }}>
                                Last Login: <strong style={{ color: 'var(--color-text)' }}>{formatRelativeTime(u.lastLoginAt)}</strong>
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-subtle)', marginTop: '2px', display: 'block' }}>
                                Total Logins: <strong style={{ color: 'var(--color-text)' }}>{u.totalSessionsCount || 0}</strong> {u.activeSessionsCount > 0 && <span style={{ color: '#2ec4b6' }}>({u.activeSessionsCount} active)</span>}
                              </span>
                            </div>

                            <button
                              onClick={() => setSelectedUserForModal(u)}
                              style={{
                                padding: '8px 14px',
                                borderRadius: '10px',
                                background: 'rgba(255,107,53,0.1)',
                                border: '1px solid rgba(255,107,53,0.25)',
                                color: 'var(--color-primary)',
                                fontSize: '12.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              Sessions <ChevronRight size={14} />
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── VIEW B: COMPACT TABLE VIEW ──────────────────────────────────── */}
            {activeSubSection === 'users' && userViewMode === 'table' && (
              <div style={{ background: 'var(--color-surface)', borderRadius: '20px', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                {filteredUsers.length === 0 ? (
                  <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <Users size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <p style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>No portal users matched your filter query.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          <th style={{ padding: '14px 20px', fontWeight: 700 }}>User Identity</th>
                          <th style={{ padding: '14px 16px', fontWeight: 700 }}>Contact & Verification</th>
                          <th style={{ padding: '14px 16px', fontWeight: 700 }}>Linked Business(es)</th>
                          <th style={{ padding: '14px 16px', fontWeight: 700, textAlign: 'center' }}>Sessions</th>
                          <th style={{ padding: '14px 16px', fontWeight: 700 }}>Last Login</th>
                          <th style={{ padding: '14px 16px', fontWeight: 700 }}>Registered Date</th>
                          <th style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => {
                          const initial = (u.name || u.email || 'U').charAt(0).toUpperCase();
                          return (
                            <tr key={u.userId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td style={{ padding: '14px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: u.googleId ? 'linear-gradient(135deg, #4285F4, #34A853)' : 'linear-gradient(135deg, var(--color-primary), #ff9f1c)',
                                    color: '#fff', fontWeight: 800, fontSize: '14px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                  }}>
                                    {initial}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      {u.name}
                                      {u.googleId && (
                                        <span style={{ fontSize: '10.5px', padding: '1px 6px', borderRadius: '6px', background: 'rgba(66,133,244,0.12)', color: '#4285F4', fontWeight: 700 }}>
                                          Google
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                      <Mail size={12} /> {u.email}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td style={{ padding: '14px 16px' }}>
                                <div style={{ fontSize: '13px', color: 'var(--color-text)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                  <Phone size={12} color="var(--color-text-muted)" /> {u.mobile || 'Not set'}
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  {u.emailVerified ? (
                                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'rgba(46,196,182,0.12)', color: '#2ec4b6', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <CheckCircle2 size={11} /> Verified
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'rgba(230,57,70,0.12)', color: '#e63946', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <XCircle size={11} /> Unverified
                                    </span>
                                  )}
                                  {u.needsPasswordReset && (
                                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'rgba(245,158,11,0.12)', color: '#b45309', fontWeight: 700 }}>
                                      Reset Pending
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td style={{ padding: '14px 16px' }}>
                                {!u.businesses || u.businesses.length === 0 ? (
                                  <span style={{ fontSize: '12px', color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>No business linked</span>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {u.businesses.map((b, idx) => (
                                      <div key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        <Building2 size={13} color="var(--color-primary)" />
                                        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{b.businessName}</span>
                                        <span style={{ fontSize: '10.5px', padding: '1px 6px', borderRadius: '6px', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                                          {b.role || 'Owner'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>

                              <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text)' }}>
                                  {u.totalSessionsCount || 0}
                                </div>
                                {u.activeSessionsCount > 0 ? (
                                  <span style={{ fontSize: '11px', color: '#2ec4b6', fontWeight: 700 }}>
                                    {u.activeSessionsCount} active now
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '11px', color: 'var(--color-text-subtle)' }}>
                                    No active JWT
                                  </span>
                                )}
                              </td>

                              <td style={{ padding: '14px 16px' }}>
                                <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '13px' }}>
                                  {formatRelativeTime(u.lastLoginAt)}
                                </div>
                                {u.lastLoginAt && (
                                  <div style={{ fontSize: '11px', color: 'var(--color-text-subtle)', marginTop: '2px' }}>
                                    {formatDate(u.lastLoginAt)}
                                  </div>
                                )}
                              </td>

                              <td style={{ padding: '14px 16px', color: 'var(--color-text-muted)', fontSize: '12.5px' }}>
                                {formatDate(u.createdAt)}
                              </td>

                              <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                <button
                                  onClick={() => setSelectedUserForModal(u)}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '10px',
                                    background: 'var(--color-bg-subtle)',
                                    border: '1px solid var(--color-border)',
                                    color: 'var(--color-primary)',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  Sessions <ChevronRight size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── VIEW C: GLOBAL LOGIN SESSION AUDIT TRAIL ────────────────────── */}
            {activeSubSection === 'audit' && (
              <div style={{ background: 'var(--color-surface)', borderRadius: '20px', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                      Recent Portal User Login History
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      Comprehensive audit log of authentication tokens issued, IP addresses, and user-agents.
                    </p>
                  </div>
                  <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '12px', background: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    Latest {loginAuditTrail.length} Login Events
                  </span>
                </div>

                {loginAuditTrail.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <Clock size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <p style={{ fontSize: '14px', margin: 0 }}>No portal user logins recorded yet.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          <th style={{ padding: '12px 20px', fontWeight: 700 }}>Login Timestamp</th>
                          <th style={{ padding: '12px 16px', fontWeight: 700 }}>User Identity</th>
                          <th style={{ padding: '12px 16px', fontWeight: 700 }}>IP Address</th>
                          <th style={{ padding: '12px 16px', fontWeight: 700 }}>Device & Browser Specs</th>
                          <th style={{ padding: '12px 16px', fontWeight: 700 }}>Token Expiry</th>
                          <th style={{ padding: '12px 20px', fontWeight: 700, textAlign: 'right' }}>Session Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loginAuditTrail.map((log) => (
                          <tr key={log.sessionId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            
                            <td style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--color-text)' }}>
                              <div>{formatDate(log.createdAt)}</div>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-subtle)' }}>{formatRelativeTime(log.createdAt)}</span>
                            </td>

                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{log.userName}</div>
                              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{log.userEmail}</div>
                            </td>

                            <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: 'var(--color-primary)', fontWeight: 600 }}>
                              {log.ipAddress || '127.0.0.1'}
                            </td>

                            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {log.userAgent || 'Standard Browser'}
                            </td>

                            <td style={{ padding: '12px 16px', color: 'var(--color-text-subtle)', fontSize: '12px' }}>
                              {formatDate(log.tokenExpiresAt)}
                            </td>

                            <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                              {log.isActive ? (
                                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', background: 'rgba(46,196,182,0.12)', color: '#2ec4b6', fontWeight: 700 }}>
                                  Active Session
                                </span>
                              ) : (
                                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', background: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                  Expired / Signed Out
                                </span>
                              )}
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: WEBSITE & TRAFFIC TELEMETRY */}
        {/* =================================================================== */}
        {activeTab === 'website' && (
          <div>
            {/* 1. KPI Summary Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              
              <div style={{ padding: '20px 24px', borderRadius: '18px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)' }}>Total Visitors</span>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(255,107,53,0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
                  {summary.totalVisitors || 0}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-subtle)', marginTop: '4px', display: 'block' }}>
                  Total website sessions logged
                </span>
              </div>

              <div style={{ padding: '20px 24px', borderRadius: '18px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)' }}>Unique Visitors</span>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(46,196,182,0.1)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserCheck size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
                  {summary.uniqueVisitors || 0}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-success)', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                  {summary.returningVisitors || 0} Returning Visitors
                </span>
              </div>

              <div style={{ padding: '20px 24px', borderRadius: '18px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)' }}>Avg Duration</span>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
                  {formatDuration(summary.avgSessionDurationSeconds)}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-subtle)', marginTop: '4px', display: 'block' }}>
                  Time spent per session
                </span>
              </div>

              <div style={{ padding: '20px 24px', borderRadius: '18px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)' }}>Bounce Rate</span>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(255,183,3,0.12)', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
                  {summary.bounceRatePercent || 0}%
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-subtle)', marginTop: '4px', display: 'block' }}>
                  Single page exits (&lt;10s)
                </span>
              </div>

            </div>

            {/* 2. Traffic Sources & Device Telemetry Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              
              {/* Traffic Source Channels */}
              <div style={{ padding: '24px', borderRadius: '20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Compass size={18} color="var(--color-primary)" /> Traffic Sources & Attribution
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Referrals & Campaigns</span>
                </div>

                {sortedSources.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>No traffic channels logged yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {sortedSources.map(([source, count]) => {
                      const pct = Math.round((count / totalHits) * 100);
                      return (
                        <div key={source}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
                            <span style={{ color: 'var(--color-text)' }}>{source}</span>
                            <span style={{ color: 'var(--color-text-muted)' }}>{count} visits ({pct}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', borderRadius: '9999px', background: 'var(--color-bg-subtle)', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', borderRadius: '9999px', background: 'var(--color-primary)', transition: 'width 0.4s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Device Telemetry */}
              <div style={{ padding: '24px', borderRadius: '20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Monitor size={18} color="var(--color-primary)" /> Device & Platform Breakdown
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Hardware & OS</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {sortedDevices.map(([dev, count]) => (
                    <div key={dev} style={{ flex: 1, minWidth: '100px', padding: '12px 14px', borderRadius: '12px', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>{dev}</span>
                      <strong style={{ fontSize: '18px', color: 'var(--color-text)' }}>{count}</strong>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-subtle)', display: 'block', marginBottom: '8px' }}>Browsers</span>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13.5px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {sortedBrowsers.map(([b, c]) => (
                        <li key={b} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)' }}>
                          <span>{b}</span>
                          <strong style={{ color: 'var(--color-text)' }}>{c}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-subtle)', display: 'block', marginBottom: '8px' }}>Operating System</span>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13.5px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {sortedOS.map(([os, c]) => (
                        <li key={os} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)' }}>
                          <span>{os}</span>
                          <strong style={{ color: 'var(--color-text)' }}>{c}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

            </div>

            {/* 3. Top Pages & Geographic Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
              
              <div style={{ padding: '24px', borderRadius: '20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Eye size={18} color="var(--color-primary)" /> Top Visited Pages
                </h3>

                {sortedPages.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>No pageview data recorded yet.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '8px 0', fontWeight: 700 }}>Page Route</th>
                        <th style={{ padding: '8px 0', fontWeight: 700, textAlign: 'right' }}>Pageviews</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPages.slice(0, 10).map(([path, views]) => (
                        <tr key={path} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '10px 0', fontFamily: 'monospace', color: 'var(--color-primary)', fontWeight: 600 }}>{path}</td>
                          <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700, color: 'var(--color-text)' }}>{views}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div style={{ padding: '24px', borderRadius: '20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={18} color="var(--color-primary)" /> Geographic Location & Cities
                </h3>

                {sortedCities.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>No geographic logs available.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {sortedCities.map(([city, count]) => (
                      <div key={city} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'var(--color-bg-subtle)' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>📍 {city}</span>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)' }}>{count} sessions</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* USER SESSION DETAIL MODAL */}
        {/* =================================================================== */}
        {selectedUserForModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              background: 'var(--color-surface)',
              borderRadius: '24px',
              border: '1px solid var(--color-border)',
              width: '100%',
              maxWidth: '720px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-lg)',
              padding: '28px'
            }}>
              {/* Modal Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
                      User Session Audit Trail
                    </h2>
                    {selectedUserForModal.googleId && (
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(66,133,244,0.12)', color: '#4285F4', fontWeight: 700 }}>
                        Google OAuth
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: 'var(--color-text-muted)' }}>
                    {selectedUserForModal.name} ({selectedUserForModal.email})
                  </p>
                </div>
                <button
                  onClick={() => setSelectedUserForModal(null)}
                  style={{
                    background: 'var(--color-bg-subtle)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-text)',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* User Overview Grid inside Modal */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px', background: 'var(--color-bg-subtle)', padding: '16px', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>Mobile Number</span>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--color-text)', marginTop: '2px' }}>
                    {selectedUserForModal.mobile || 'Not set'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>Verification Status</span>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: selectedUserForModal.emailVerified ? '#2ec4b6' : '#e63946', marginTop: '2px' }}>
                    {selectedUserForModal.emailVerified ? 'Verified Email' : 'Unverified Email'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>Last Login</span>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--color-text)', marginTop: '2px' }}>
                    {formatRelativeTime(selectedUserForModal.lastLoginAt)}
                  </div>
                </div>
              </div>

              {/* Session Records */}
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: 'var(--color-text)' }}>
                Issued Authentication Tokens ({selectedUserForModal.recentSessions?.length || 0})
              </h3>

              {!selectedUserForModal.recentSessions || selectedUserForModal.recentSessions.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '13.5px' }}>No session logs recorded for this user.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedUserForModal.recentSessions.map((s) => (
                    <div key={s.sessionId} style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                          IP: {s.ipAddress || '127.0.0.1'}
                        </span>
                        {s.isActive ? (
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(46,196,182,0.12)', color: '#2ec4b6', fontWeight: 700 }}>
                            Active Token
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                            Inactive / Expired
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', wordBreak: 'break-all', marginBottom: '6px' }}>
                        User Agent: {s.userAgent || 'Standard Client Browser'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--color-text-subtle)', flexWrap: 'wrap', gap: '8px' }}>
                        <span>Logged In: {formatDate(s.createdAt)}</span>
                        <span>Token Expires: {formatDate(s.tokenExpiresAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
