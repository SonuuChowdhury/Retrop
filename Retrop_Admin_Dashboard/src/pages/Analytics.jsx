// ============================================================================
// RETROP ADMIN — WEBSITE & VISITOR ANALYTICS DASHBOARD (/analytics)
// ============================================================================

import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../services/api';
import {
  Users, UserCheck, Clock, TrendingUp, RefreshCw, Smartphone, Monitor,
  Globe, Shield, Eye, ArrowUpRight, Award, Compass, Laptop, Zap
} from 'lucide-react';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalytics = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await api.getWebsiteAnalytics();
      if (res.status === 'success' && res.data) {
        setData(res.data);
      } else {
        setError('Failed to load website analytics metrics.');
      }
    } catch (err) {
      setError(err.message || 'Server error loading website analytics.');
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

  if (loading && !data) {
    return (
      <Layout>
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <div className="spinner animate-spin" style={{ width: 32, height: 32, margin: '60px auto', borderWidth: 3, borderColor: 'var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Loading real-time website analytics...</p>
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

  // Convert map objects to sorted arrays
  const sortedPages = Object.entries(summary.pagesVisited || {}).sort((a, b) => b[1] - a[1]);
  const sortedSources = Object.entries(summary.trafficSources || {}).sort((a, b) => b[1] - a[1]);
  const sortedDevices = Object.entries(summary.deviceTypes || {}).sort((a, b) => b[1] - a[1]);
  const sortedBrowsers = Object.entries(summary.browsers || {}).sort((a, b) => b[1] - a[1]);
  const sortedOS = Object.entries(summary.operatingSystems || {}).sort((a, b) => b[1] - a[1]);
  const sortedCities = Object.entries(summary.cities || {}).sort((a, b) => b[1] - a[1]);

  const totalHits = summary.totalVisitors || 1;

  return (
    <Layout>
      <div style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header Title & Refresh Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.5px' }}>
                Website & Visitor Analytics
              </h1>
              <span className="badge badge-primary" style={{ padding: '4px 10px', fontSize: '12px', fontWeight: 700, borderRadius: '20px', background: 'rgba(255,107,53,0.12)', color: 'var(--color-primary)' }}>
                Live Stream
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
              Real-time traffic telemetry, visitor metrics, device specs, and referral attribution.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-subtle)' }}>
              Updated: {summary.lastUpdated || 'Just now'}
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
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '14px 18px', background: 'rgba(230,57,70,0.08)', border: '1px solid #e63946', borderRadius: '12px', color: '#e63946', marginBottom: '24px', fontSize: '14px', fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── 1. KPI Summary Cards Grid ──────────────────────────────────────── */}
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
              Total sessions logged
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

        {/* ── 2. Two-Column Layout: Traffic Sources & Device Telemetry ─────────────── */}
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

            {/* Device Type Chips */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {sortedDevices.map(([dev, count]) => (
                <div key={dev} style={{ flex: 1, minWidth: '100px', padding: '12px 14px', borderRadius: '12px', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>{dev}</span>
                  <strong style={{ fontSize: '18px', color: 'var(--color-text)' }}>{count}</strong>
                </div>
              ))}
            </div>

            {/* Browsers & OS Lists */}
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

        {/* ── 3. Top Visited Pages & Geographic Location Grid ────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          
          {/* Top Pages Table */}
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

          {/* Geographic Location & Network */}
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
    </Layout>
  );
}
