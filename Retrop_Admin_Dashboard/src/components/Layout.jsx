import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';
import logo from '../assets/retrop-logo.png';
import { LayoutDashboard, Store, LogOut, User, Settings, CreditCard, Receipt, Menu, X } from 'lucide-react';

export default function Layout({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('retrop_admin_token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await api.me();
        if (res.status === 'success' && res.data) {
          setAdmin(res.data);
        }
      } catch (err) {
        localStorage.removeItem('retrop_admin_token');
        localStorage.removeItem('retrop_admin_refresh_token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.logout();
    } catch (err) {
      // Ignore network errors
    } finally {
      setLoggingOut(false);
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Restaurants', path: '/restaurants', icon: <Store size={20} /> },
    { label: 'Transactions', path: '/transactions', icon: <Receipt size={20} /> },
    { label: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div style={styles.container}>
      {/* Mobile Top Header */}
      {isMobile && (
        <header style={styles.mobileHeader}>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={styles.menuToggle}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <img src={logo} alt="Retrop logo" style={styles.mobileLogo} />
          <div style={{ width: 24 }} />
        </header>
      )}

      {/* Backdrop for Mobile Sidebar */}
      {isMobile && isMobileMenuOpen && (
        <div onClick={() => setIsMobileMenuOpen(false)} style={styles.backdrop} />
      )}

      {/* Sidebar */}
      <aside style={{
        ...styles.sidebar,
        transform: isMobile ? (isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div style={styles.brand}>
          <img src={logo} alt="Retrop logo" style={styles.logo} />
          <span style={styles.badge}>Control Panel</span>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => isMobile && setIsMobileMenuOpen(false)}
                style={{
                  ...styles.navLink,
                  backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                  fontWeight: isActive ? '600' : '400',
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={styles.sidebarFooter}>
          {admin && (
            <div style={styles.adminProfile}>
              <div style={styles.avatar}>
                <User size={16} />
              </div>
              <div style={styles.adminInfo}>
                <span style={styles.adminName}>{admin.name}</span>
                <span style={styles.adminRole}>Retrop Admin</span>
              </div>
            </div>
          )}
          <button onClick={handleLogout} style={styles.logoutButton} disabled={loggingOut}>
            {loggingOut ? (
              <span className="spinner" style={{ marginRight: '6px' }}></span>
            ) : (
              <LogOut size={18} />
            )}
            <span>{loggingOut ? 'Signing Out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{
        ...styles.main,
        paddingLeft: isMobile ? 0 : '260px',
        paddingTop: isMobile ? '60px' : 0,
      }}>
        <main style={{
          ...styles.content,
          padding: isMobile ? '20px 16px' : '40px',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}

const styles = {
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--color-bg)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid var(--color-border)',
    borderTopColor: 'var(--color-primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--color-bg)',
  },
  sidebar: {
    width: '260px',
    backgroundColor: 'var(--color-card)',
    borderRight: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
  },
  brand: {
    padding: '30px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    borderBottom: '1px solid var(--color-border)',
  },
  logo: {
    height: '28px',
    width: 'auto',
    alignSelf: 'flex-start',
    objectFit: 'contain',
  },
  badge: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-primary)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    alignSelf: 'flex-start',
    backgroundColor: 'var(--color-primary-light)',
    padding: '2px 6px',
    borderRadius: '4px',
    marginTop: '4px',
  },
  nav: {
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '15px',
    transition: 'var(--transition)',
  },
  sidebarFooter: {
    padding: '20px 16px',
    borderTop: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  adminProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingHorizontal: '8px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text-muted)',
  },
  adminInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  adminName: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--color-text)',
  },
  adminRole: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    color: 'var(--color-text-muted)',
    fontSize: '15px',
    textAlign: 'left',
    width: '100%',
    transition: 'var(--transition)',
    ':hover': {
      color: 'var(--color-error)',
      backgroundColor: 'var(--color-error-light)',
    },
  },
  main: {
    flex: 1,
    paddingLeft: '260px',
  },
  content: {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  mobileHeader: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '60px',
    backgroundColor: 'var(--color-card)',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    zIndex: 20,
  },
  menuToggle: {
    color: 'var(--color-text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileLogo: {
    height: '24px',
    width: 'auto',
    objectFit: 'contain',
  },
  backdrop: {
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9,
  },
};
