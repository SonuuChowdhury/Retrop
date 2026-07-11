import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../services/api';
import { FileText, Search, CreditCard, DollarSign, Download, ArrowUpRight } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';
import { useTitle } from '../context/TitleContext';

export default function Transactions() {
  useTitle('Transactions');
  const [transactions, setTransactions] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.listTransactions();
        if (res.status === 'success' && res.data) {
          setTransactions(res.data);
        }
      } catch (err) {
        setError('Failed to load transaction history.');
      }
    };

    const fetchConfig = async () => {
      try {
        const res = await api.getBusinessConfig();
        if (res.status === 'success' && res.data) {
          setConfig(res.data);
        }
      } catch (err) {
        console.error('Failed to load business config:', err);
      }
    };

    Promise.all([fetchTransactions(), fetchConfig()]).finally(() => {
      setLoading(false);
    });
  }, []);

  const filtered = transactions.filter((t) => {
    const query = search.toLowerCase();
    const bizName = t.retrop_restaurant?.businessName?.toLowerCase() || '';
    const invoice = t.invoiceNo?.toLowerCase() || '';
    const upi = t.upiTransactionId?.toLowerCase() || '';
    const desc = t.description?.toLowerCase() || '';
    return bizName.includes(query) || invoice.includes(query) || upi.includes(query) || desc.includes(query);
  });

  const totalSales = transactions
    .filter(t => t.status === 'paid')
    .reduce((sum, t) => sum + parseFloat(t.finalAmount), 0);

  const totalBase = transactions
    .filter(t => t.status === 'paid')
    .reduce((sum, t) => sum + parseFloat(t.baseAmount), 0);

  const totalGst = transactions
    .filter(t => t.status === 'paid')
    .reduce((sum, t) => sum + parseFloat(t.gstAmount), 0);

  return (
    <Layout>
      <div style={styles.header} className="responsive-header">
        <div>
          <h1 style={styles.title}>Transactions Ledger</h1>
          <p style={styles.subtitle}>Audit revenue streams, search invoices, and track cash/UPI ledger records</p>
        </div>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          <p>{error}</p>
        </div>
      )}

      {/* Summary Metrics */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>{config?.isTaxEnabled !== false ? 'Total Revenue (GST Incl.)' : 'Total Revenue'}</span>
          <span style={styles.metricValue}>INR {totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        {config?.isTaxEnabled !== false && (
          <>
            <div style={styles.metricCard}>
              <span style={styles.metricLabel}>Base Value (Net Profit)</span>
              <span style={styles.metricValue}>INR {totalBase.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricLabel}>GST Collected ({config?.gstRate || 18}% Liability)</span>
              <span style={styles.metricValue}>INR {totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </>
        )}
      </div>

      <div style={styles.tableCard}>
        {/* Search Filter Bar */}
        <div style={styles.searchBar}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by business name, invoice number, UPI reference ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.tableWrapper} className="responsive-table-container">
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Invoice No</th>
                <th style={styles.th}>Business Name</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Payment details</th>
                <th style={styles.th}>Total Paid (GST Inc)</th>
                <th style={styles.th} style={{ ...styles.th, textAlign: 'right' }}>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}><SkeletonLoader width="110px" height="18px" /></td>
                    <td style={styles.td}><SkeletonLoader width="140px" height="18px" /></td>
                    <td style={styles.td}><SkeletonLoader width="180px" height="18px" /></td>
                    <td style={styles.td}><SkeletonLoader width="120px" height="18px" /></td>
                    <td style={styles.td}><SkeletonLoader width="90px" height="18px" /></td>
                    <td style={styles.td} style={{ ...styles.td, textAlign: 'right' }}><SkeletonLoader width="32px" height="32px" style={{ marginLeft: 'auto' }} /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" style={styles.emptyTd}>No transactions match the search filter criteria.</td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.transactionId} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={styles.invoiceNo}>{tx.invoiceNo}</span>
                      <span style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString('en-IN')}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.bizCol}>
                        <span style={styles.bizName}>{tx.retrop_restaurant?.businessName || 'Support Incident'}</span>
                        <span style={styles.bizContact}>{tx.retrop_restaurant?.ownerName} ({tx.retrop_restaurant?.ownerMobile})</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.txDesc}>{tx.description}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.payCol}>
                        <span style={styles.payMethod}>{tx.paymentMethod}</span>
                        {tx.upiTransactionId && (
                          <span style={styles.upiRef}>Ref: {tx.upiTransactionId}</span>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.amtCol}>
                        <span style={styles.finalAmt}>INR {parseFloat(tx.finalAmount).toFixed(2)}</span>
                        {parseFloat(tx.gstAmount) > 0 ? (
                          <span style={styles.gstBreakdown}>Base: {parseFloat(tx.baseAmount).toFixed(2)} ({((parseFloat(tx.gstAmount) / parseFloat(tx.baseAmount)) * 100).toFixed(0)}% GST)</span>
                        ) : null}
                      </div>
                    </td>
                    <td style={styles.td} style={{ ...styles.td, textAlign: 'right' }}>
                      {tx.invoiceNo ? (
                        <a
                          href={api.getInvoiceUrl(tx.transactionId)}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Invoice PDF"
                          style={styles.invoiceBtn}
                        >
                          <FileText size={16} />
                          <ArrowUpRight size={12} style={{ marginLeft: '-2px' }} />
                        </a>
                      ) : (
                        <span style={styles.noInvoice}>N/A</span>
                      )}
                    </td>
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
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '32px',
  },
  metricCard: {
    backgroundColor: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow)',
  },
  metricLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: '800',
    color: 'var(--color-text)',
  },
  tableCard: {
    backgroundColor: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: 'var(--shadow)',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    padding: '10px 16px',
    marginBottom: '20px',
    gap: '12px',
  },
  searchIcon: {
    color: 'var(--color-text-muted)',
  },
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--color-text)',
    outline: 'none',
    width: '100%',
    fontSize: '14px',
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
    fontSize: '11px',
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
    verticalAlign: 'middle',
  },
  invoiceNo: {
    fontFamily: 'monospace',
    fontWeight: '600',
    fontSize: '13px',
    display: 'block',
  },
  txDate: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    marginTop: '2px',
    display: 'block',
  },
  bizCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  bizName: {
    fontWeight: '600',
  },
  bizContact: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
    marginTop: '2px',
  },
  txDesc: {
    fontSize: '13px',
    color: 'var(--color-text-muted)',
  },
  payCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  payMethod: {
    fontWeight: '600',
  },
  upiRef: {
    fontSize: '11px',
    fontFamily: 'monospace',
    color: 'var(--color-text-muted)',
    marginTop: '2px',
  },
  amtCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  finalAmt: {
    fontWeight: '700',
    color: 'var(--color-text)',
  },
  gstBreakdown: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    marginTop: '2px',
  },
  invoiceBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--color-border)',
    color: 'var(--color-primary)',
    backgroundColor: 'var(--color-primary-light)',
    transition: 'var(--transition)',
    cursor: 'pointer',
  },
  noInvoice: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
  },
  emptyTd: {
    padding: '40px 16px',
    textAlign: 'center',
    color: 'var(--color-text-muted)',
    fontSize: '14px',
  },
  errorBanner: {
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-error-light)',
    color: 'var(--color-error)',
    marginBottom: '24px',
  },
};
