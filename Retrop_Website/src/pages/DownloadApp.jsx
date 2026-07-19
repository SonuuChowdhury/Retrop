// ============================================================================
// APP DOWNLOAD & VERSION HISTORY PAGE (/downloads/:appId)
// ============================================================================

import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageWrapper from '../components/PageWrapper';
import { DOWNLOADABLE_APPS } from '../data/downloadsData';

function DownloadButton({ url, className, children, iconName = 'DownloadCloud', style = {} }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'downloading' | 'done'
  const IconComp = Icons[iconName] || Icons.Download;

  const handleClick = (e) => {
    e.preventDefault();
    if (status === 'downloading') return;

    setStatus('downloading');

    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show downloading status feedback
    setTimeout(() => {
      setStatus('done');
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }, 2000);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      disabled={status === 'downloading'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: status === 'downloading' ? 'wait' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: status === 'downloading' ? 0.85 : 1,
        ...style,
      }}
    >
      {status === 'downloading' && (
        <>
          <Icons.Loader2 size={16} className="animate-spin" />
          <span>Downloading...</span>
        </>
      )}
      {status === 'done' && (
        <>
          <Icons.CheckCircle2 size={16} color="#22c55e" />
          <span>Download Started!</span>
        </>
      )}
      {status === 'idle' && (
        <>
          <IconComp size={16} />
          <span>{children}</span>
        </>
      )}
    </button>
  );
}

export default function DownloadApp() {

  const { appId } = useParams();

  const app = DOWNLOADABLE_APPS.find((a) => a.id === appId);

  if (!app) {
    return (
      <PageWrapper title="App Not Found">
        <Navbar />
        <main style={{ flex: 1, padding: '120px 24px', textAlign: 'center' }}>
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <Icons.AlertTriangle size={64} color="var(--color-danger)" style={{ marginBottom: '24px' }} />
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '16px' }}>Application Not Found</h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px' }}>
              The software application you are looking for does not exist or has been removed.
            </p>
            <Link to="/downloads" className="btn btn-primary">
              Back to Downloads
            </Link>
          </div>
        </main>
        <Footer />
      </PageWrapper>
    );
  }

  const latestVersion = app.versions[0];
  const allVersions = app.versions;
  const IconComponent = Icons[app.iconName] || Icons.Download;

  return (
    <PageWrapper title={`Download ${app.name}`}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <div className="app-detail-container">
          
          {/* Back Link */}
          <Link to="/downloads" className="back-link">
            <Icons.ArrowLeft size={16} />
            Back to Downloads
          </Link>

          {/* App Header Banner */}
          <div className="app-banner">
            <div className="app-icon-box">
              <IconComponent size={36} />
            </div>
            <div className="app-title-text">
              <h1>Download {app.name}</h1>
              <p>{app.tagline} • Official Release</p>
            </div>
          </div>

          <div className="app-sections-gap">
            
            {/* 1. LATEST VERSION SECTION */}
            <section>
              <div className="section-title-label">
                <Icons.Sparkles size={16} />
                Latest Version
              </div>

              <div className="latest-card">
                <div className="latest-top-border" />

                <div className="latest-header">
                  <div className="latest-info">
                    <div className="latest-version-row">
                      <span className="latest-version-tag">{latestVersion.version}</span>
                      <span className="badge badge-success">Stable Build</span>
                    </div>
                    <div className="latest-meta-row">
                      <span>Released: <strong>{latestVersion.releaseDate}</strong></span>
                      <span>•</span>
                      <span>Size: <strong>{latestVersion.fileSize}</strong></span>
                    </div>
                  </div>

                  <DownloadButton url={latestVersion.downloadUrl} className="btn btn-primary latest-download-btn" iconName="DownloadCloud">
                    Download APK Direct Link
                  </DownloadButton>
                </div>

                {/* Changelog */}
                <div className="latest-changelog">
                  <h3>
                    <Icons.CheckCircle2 size={16} color="var(--color-success)" />
                    What's New in {latestVersion.version}
                  </h3>
                  <ul className="changelog-list">
                    {latestVersion.changelog.map((item, idx) => (
                      <li key={idx}>
                        <span className="bullet-dot" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* 2. ALL VERSIONS SECTION */}
            <section>
              <div className="section-title-label">
                <Icons.History size={16} />
                All Versions
              </div>

              {/* Desktop Table View (Hidden on mobile) */}
              <div className="history-table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Version</th>
                      <th>Release Date</th>
                      <th>File Size</th>
                      <th>Type</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allVersions.map((v, index) => (
                      <tr key={v.version}>
                        <td style={{ fontWeight: 700 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {v.version}
                            {index === 0 && <span className="latest-inline-badge">LATEST</span>}
                          </div>
                        </td>
                        <td style={{ color: 'var(--color-text-muted)' }}>{v.releaseDate}</td>
                        <td style={{ color: 'var(--color-text-muted)' }}>{v.fileSize}</td>
                        <td>
                          <span className="apk-label">APK</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <DownloadButton url={v.downloadUrl} className="btn btn-secondary btn-sm table-download-btn" iconName="Download">
                            Download
                          </DownloadButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View (Hidden on desktop) */}
              <div className="history-list-mobile">
                {allVersions.map((v, index) => (
                  <div key={v.version} className="history-mobile-card">
                    <div className="history-mobile-header">
                      <div className="history-mobile-title">
                        <strong>{v.version}</strong>
                        {index === 0 && <span className="latest-inline-badge">LATEST</span>}
                      </div>
                      <span className="apk-label">APK</span>
                    </div>
                    <div className="history-mobile-meta">
                      <div>
                        <span>Release Date:</span> <strong>{v.releaseDate}</strong>
                      </div>
                      <div>
                        <span>File Size:</span> <strong>{v.fileSize}</strong>
                      </div>
                    </div>
                    <DownloadButton url={v.downloadUrl} className="btn btn-secondary history-mobile-btn" iconName="Download">
                      Download APK
                    </DownloadButton>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      </main>
      <Footer />

      <style>{`
        /* ── Page Layout ────────────────────────────────────────────────── */
        .app-detail-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 108px 24px 80px;
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--color-text-muted);
          text-decoration: none;
          margin-bottom: 32px;
          font-size: 14px;
          font-weight: 600;
          transition: var(--transition-fast);
        }
        .back-link:hover {
          color: var(--color-primary);
        }
        .app-sections-gap {
          display: flex;
          flex-direction: column;
          gap: 48px;
        }

        /* ── App Banner ─────────────────────────────────────────────────── */
        .app-banner {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 40px;
        }
        .app-icon-box {
          width: 80px;
          height: 80px;
          border-radius: 22px;
          background: var(--color-primary-light);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-primary);
          flex-shrink: 0;
        }
        .app-title-text h1 {
          font-size: 36px;
          font-weight: 850;
          margin: 0;
          letter-spacing: -1.5px;
          line-height: 1.1;
          color: var(--color-text);
        }
        .app-title-text p {
          font-size: 15px;
          color: var(--color-text-muted);
          margin: 8px 0 0;
          font-weight: 500;
        }

        /* ── Title Label ────────────────────────────────────────────────── */
        .section-title-label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          font-weight: 700;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--color-text-muted);
        }

        /* ── Latest Card ────────────────────────────────────────────────── */
        .latest-card {
          position: relative;
          overflow: hidden;
          padding: 40px;
          background: linear-gradient(145deg, var(--color-surface) 0%, var(--color-bg-alt) 100%);
          border: 1px solid var(--color-border-strong);
          border-radius: 20px;
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .latest-top-border {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #2EC4B6, #FF6B35);
        }
        .latest-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 24px;
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 28px;
        }
        .latest-version-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .latest-version-tag {
          font-size: 28px;
          font-weight: 800;
          color: var(--color-text);
          letter-spacing: -0.5px;
        }
        .latest-meta-row {
          display: flex;
          gap: 12px;
          margin-top: 8px;
          font-size: 13px;
          color: var(--color-text-muted);
        }
        .latest-download-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border-radius: 12px;
          padding: 12px 24px;
          box-shadow: 0 8px 24px rgba(255, 107, 53, 0.25);
        }

        /* Changelog */
        .latest-changelog h3 {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--color-text);
        }
        .changelog-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .changelog-list li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 15px;
          line-height: 1.5;
          color: var(--color-text-muted);
        }
        .bullet-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-primary);
          margin-top: 8px;
          flex-shrink: 0;
        }

        /* ── All Versions Table ─────────────────────────────────────────── */
        .history-table-wrapper {
          border-radius: 20px;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          overflow: hidden;
        }
        .history-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 15px;
        }
        .history-table th {
          padding: 16px 24px;
          font-weight: 700;
          color: var(--color-text);
          background: var(--color-bg-alt);
          border-bottom: 1px solid var(--color-border-strong);
        }
        .history-table td {
          padding: 18px 24px;
          border-bottom: 1px solid var(--color-border);
          color: var(--color-text);
        }
        .history-table tr:last-child td {
          border-bottom: none;
        }
        .latest-inline-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          background: var(--color-primary-light);
          color: var(--color-primary);
        }
        .apk-label {
          font-size: 12px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
          background: var(--color-bg-subtle);
          border: 1px solid var(--color-border);
          color: var(--color-text-muted);
        }
        .table-download-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 8px;
        }

        /* ── Mobile Layouts ─────────────────────────────────────────────── */
        .history-list-mobile {
          display: none;
          flex-direction: column;
          gap: 16px;
        }
        .history-mobile-card {
          padding: 20px;
          border-radius: 16px;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .history-mobile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .history-mobile-title {
          font-size: 17px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--color-text);
        }
        .history-mobile-meta {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 14px;
          color: var(--color-text-muted);
        }
        .history-mobile-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 10px;
          width: 100%;
        }

        /* ── Responsive Overrides ───────────────────────────────────────── */
        @media (max-width: 640px) {
          .app-detail-container {
            padding: 92px 16px 48px;
          }
          .back-link {
            margin-bottom: 24px;
          }
          .app-banner {
            flex-direction: column;
            text-align: center;
            gap: 16px;
            margin-bottom: 32px;
          }
          .app-icon-box {
            width: 72px;
            height: 72px;
            border-radius: 18px;
          }
          .app-title-text h1 {
            font-size: 26px;
            letter-spacing: -1px;
          }
          .app-sections-gap {
            gap: 36px;
          }
          .latest-card {
            padding: 24px 20px;
            gap: 20px;
          }
          .latest-header {
            flex-direction: column;
            align-items: stretch;
            gap: 20px;
            padding-bottom: 20px;
          }
          .latest-version-row {
            justify-content: center;
          }
          .latest-version-tag {
            font-size: 24px;
          }
          .latest-meta-row {
            justify-content: center;
            font-size: 12px;
          }
          .latest-download-btn {
            width: 100%;
            justify-content: center;
            padding: 12px 20px;
          }
          .latest-changelog h3 {
            font-size: 15px;
          }
          .changelog-list li {
            font-size: 14px;
          }
          
          /* Switch table to cards on mobile */
          .history-table-wrapper {
            display: none;
          }
          .history-list-mobile {
            display: flex;
          }
        }
      `}</style>
    </PageWrapper>
  );
}
