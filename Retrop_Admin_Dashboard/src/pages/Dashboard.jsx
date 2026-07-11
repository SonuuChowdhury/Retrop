import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Layout from '../components/Layout';
import SkeletonLoader from '../components/SkeletonLoader';
import { Store, Key, ShieldAlert, ArrowRight, UserCheck, DollarSign, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTitle } from '../context/TitleContext';

export default function Dashboard() {
  useTitle('Dashboard');
  const [stats, setStats] = useState(null);
  const [recentRestaurants, setRecentRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.getDashboard();
        if (res.status === 'success' && res.data) {
          setStats(res.data.stats);
          setRecentRestaurants(res.data.recentRestaurants || []);
        }
      } catch (err) {
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Layout>
      <div style={styles.header}>
        <h1 style={styles.title}>Overview</h1>
        <p style={styles.subtitle}>Ecosystem health, multi-business screening and sales tracking</p>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          <p>{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ ...styles.grid, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {/* Total Sales Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Total Revenue (Sales)</span>
            <div style={{ ...styles.iconWrapper, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={styles.cardBody}>
            {loading ? (
              <SkeletonLoader width="110px" height="36px" />
            ) : (
              <span style={styles.cardValue}>₹{(stats?.totalSales ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            )}
          </div>
        </div>

        {/* Total Businesses Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Total Businesses</span>
            <div style={{ ...styles.iconWrapper, backgroundColor: 'rgba(255, 107, 53, 0.1)', color: 'var(--color-primary)' }}>
              <Store size={20} />
            </div>
          </div>
          <div style={styles.cardBody}>
            {loading ? (
              <SkeletonLoader width="80px" height="36px" />
            ) : (
              <span style={styles.cardValue}>{stats?.totalBusinesses ?? 0}</span>
            )}
          </div>
        </div>

        {/* Active Subscriptions Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Active Licenses</span>
            <div style={{ ...styles.iconWrapper, backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
              <Key size={20} />
            </div>
          </div>
          <div style={styles.cardBody}>
            {loading ? (
              <SkeletonLoader width="80px" height="36px" />
            ) : (
              <span style={styles.cardValue}>{stats?.activeKeys ?? 0}</span>
            )}
          </div>
        </div>

        {/* Inactive Status Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Suspended Accounts</span>
            <div style={{ ...styles.iconWrapper, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)' }}>
              <ShieldAlert size={20} />
            </div>
          </div>
          <div style={styles.cardBody}>
            {loading ? (
              <SkeletonLoader width="80px" height="36px" />
            ) : (
              <span style={styles.cardValue}>{stats?.inactiveBusinesses ?? 0}</span>
            )}
          </div>
        </div>
      </div>



      {/* Main Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Recently Onboarded Businesses</h2>
          <Link to="/restaurants" style={styles.sectionLink}>
            <span>View All</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Business Name</th>
                <th style={styles.th}>Vertical</th>
                <th style={styles.th}>Owner</th>
                <th style={styles.th}>Mobile</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Onboarded On</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeleton Rows
                [1, 2, 3].map((i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}><SkeletonLoader width="140px" height="18px" /></td>
                    <td style={styles.td}><SkeletonLoader width="90px" height="18px" /></td>
                    <td style={styles.td}><SkeletonLoader width="100px" height="18px" /></td>
                    <td style={styles.td}><SkeletonLoader width="90px" height="18px" /></td>
                    <td style={styles.td}><SkeletonLoader width="70px" height="18px" /></td>
                    <td style={styles.td}><SkeletonLoader width="110px" height="18px" /></td>
                  </tr>
                ))
              ) : recentRestaurants.length === 0 ? (
                <tr>
                  <td colSpan="6" style={styles.emptyTd}>
                    No businesses onboarded yet. Get started by adding a business client.
                  </td>
                </tr>
              ) : (
                recentRestaurants.map((res) => (
                  <tr key={res.restaurantId} style={styles.tr}>
                    <td style={styles.td}>
                      <Link to={`/restaurants/${res.restaurantId}`} style={styles.businessNameLink}>
                        {res.businessName}
                      </Link>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: res.businessTypeId === 'restaurant' ? 'var(--color-primary-light)' : res.businessTypeId === 'gym' ? 'var(--color-success-light)' : 'rgba(14, 165, 233, 0.1)',
                        color: res.businessTypeId === 'restaurant' ? 'var(--color-primary)' : res.businessTypeId === 'gym' ? 'var(--color-success)' : '#0ea5e9',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {res.businessTypeId || 'restaurant'}
                      </span>
                    </td>
                    <td style={styles.td}>{res.ownerName}</td>
                    <td style={styles.td}>{res.ownerMobile}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: res.isActive ? 'var(--color-success-light)' : 'var(--color-error-light)',
                          color: res.isActive ? 'var(--color-success)' : 'var(--color-error)',
                        }}
                      >
                        {res.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td style={styles.td}>{formatDate(res.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

const styles = {
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: 'var(--color-text)',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--color-text-muted)',
    marginTop: '4px',
  },
  errorBanner: {
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-error-light)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: 'var(--color-error)',
    marginBottom: '24px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '40px',
  },
  card: {
    padding: '24px',
    borderRadius: '12px',
    backgroundColor: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  iconWrapper: {
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    display: 'flex',
    alignItems: 'baseline',
  },
  cardValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: 'var(--color-text)',
    lineHeight: 1,
  },
  section: {
    backgroundColor: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: 'var(--shadow)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--color-text)',
  },
  sectionLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    fontWeight: '600',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    borderBottom: '1px solid var(--color-border)',
  },
  th: {
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid var(--color-border)',
    ':last-child': {
      borderBottom: 'none',
    },
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    color: 'var(--color-text)',
  },
  businessNameLink: {
    color: 'var(--color-text)',
    fontWeight: '600',
    transition: 'var(--transition)',
    ':hover': {
      color: 'var(--color-primary)',
    },
  },
  statusBadge: {
    display: 'inline-flex',
    padding: '4px 10px',
    borderRadius: '100px',
    fontSize: '12px',
    fontWeight: '600',
  },
  emptyTd: {
    padding: '40px 16px',
    textAlign: 'center',
    color: 'var(--color-text-muted)',
    fontSize: '14px',
  },
};
