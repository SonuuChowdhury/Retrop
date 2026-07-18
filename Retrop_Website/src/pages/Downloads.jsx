// ============================================================================
// DOWNLOADS PAGE (/downloads) — Lists downloadable software and mobile apps
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageWrapper from '../components/PageWrapper';
import { DOWNLOADABLE_APPS } from '../data/downloadsData';

export default function Downloads() {
  return (
    <PageWrapper title="Downloads">
      <Navbar />
      <main style={{ flex: 1 }}>
        {/* Page Hero */}
        <div className="page-hero">
          <span className="badge badge-primary" style={{ margin: '0 auto 16px' }}>Software Downloads</span>
          <h1>Get Retrop Applications</h1>
          <p>
            Download production-ready clients, apps, and services built to optimize and automate your business operations.
          </p>
        </div>

        {/* Downloads Listing */}
        <section className="section-downloads">
          <div className="downloads-container">
            <div className="downloads-list">
              {DOWNLOADABLE_APPS.map((app) => {
                const IconComponent = Icons[app.iconName] || Icons.Download;
                const latestVersion = app.versions[0];

                return (
                  <div key={app.id} className="download-card">
                    {/* Top gradient border */}
                    <div className="card-top-border" />

                    {/* Header info */}
                    <div className="download-header">
                      <div className="download-app-info">
                        <div className="download-icon-box">
                          <IconComponent size={30} />
                        </div>
                        <div>
                          <h2 className="download-title">{app.name}</h2>
                          <p className="download-tagline">{app.tagline}</p>
                        </div>
                      </div>
                      <div className="download-badges">
                        <span className="badge badge-primary">{app.platform}</span>
                        <span className="badge badge-success-outline">
                          {latestVersion.version}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="download-description">
                      {app.description}
                    </p>

                    {/* Technical details row */}
                    <div className="download-tech-details">
                      <div className="download-tech-item">
                        <span className="tech-label">Version:</span>
                        <strong className="tech-val">{latestVersion.version} (Latest)</strong>
                      </div>
                      <div className="download-tech-item">
                        <span className="tech-label">Size:</span>
                        <strong className="tech-val">{app.fileSize}</strong>
                      </div>
                      <div className="download-tech-item">
                        <span className="tech-label">Requirements:</span>
                        <strong className="tech-val">{app.minAndroid}</strong>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="download-action">
                      <Link to={`/downloads/${app.id}`} className="btn btn-primary download-btn">
                        Get App & Version History
                        <Icons.ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <style>{`
        /* ── Downloads Layout ───────────────────────────────────────────── */
        .section-downloads {
          padding: 40px 0 80px;
        }
        .downloads-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .downloads-list {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        /* ── Download Card ──────────────────────────────────────────────── */
        .download-card {
          position: relative;
          overflow: hidden;
          padding: 40px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          box-shadow: var(--shadow-sm);
          transition: var(--transition-smooth);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .download-card:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
        .card-top-border {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #FF6B35, #FF9A3C);
        }

        /* ── Header ─────────────────────────────────────────────────────── */
        .download-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }
        .download-app-info {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .download-icon-box {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          background: var(--color-primary-light);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-primary);
          flex-shrink: 0;
        }
        .download-title {
          font-size: 24px;
          fontWeight: 800;
          margin: 0;
          letter-spacing: -0.5px;
          color: var(--color-text);
        }
        .download-tagline {
          font-size: 13px;
          color: var(--color-text-muted);
          margin: 4px 0 0;
          font-weight: 500;
        }
        .download-badges {
          display: flex;
          gap: 8px;
        }
        .badge-success-outline {
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 700;
          border-radius: 6px;
          background: rgba(46, 196, 182, 0.1);
          color: var(--color-success);
          border: 1px solid rgba(46, 196, 182, 0.2);
          text-transform: uppercase;
        }

        /* ── Description & Tech ─────────────────────────────────────────── */
        .download-description {
          font-size: 16px;
          line-height: 1.8;
          color: var(--color-text-muted);
          margin: 0;
        }
        .download-tech-details {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          padding: 16px 20px;
          border-radius: 12px;
          background: var(--color-bg-alt);
          border: 1px solid var(--color-border);
          font-size: 14px;
        }
        .download-tech-item {
          display: flex;
          align-items: center;
        }
        .tech-label {
          color: var(--color-text-muted);
          margin-right: 6px;
        }
        .tech-val {
          color: var(--color-text);
        }

        /* ── Actions ────────────────────────────────────────────────────── */
        .download-action {
          display: flex;
          justify-content: flex-end;
          margin-top: 8px;
        }
        .download-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        /* ── Responsive Overrides ───────────────────────────────────────── */
        @media (max-width: 640px) {
          .section-downloads {
            padding: 20px 0 60px;
          }
          .downloads-container {
            padding: 0 16px;
          }
          .downloads-list {
            gap: 20px;
          }
          .download-card {
            padding: 24px 20px;
            gap: 20px;
            border-radius: 16px;
          }
          .download-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .download-app-info {
            gap: 16px;
          }
          .download-icon-box {
            width: 52px;
            height: 52px;
            border-radius: 14px;
          }
          .download-title {
            font-size: 20px;
          }
          .download-badges {
            width: 100%;
            justify-content: flex-start;
          }
          .download-description {
            font-size: 14.5px;
            line-height: 1.7;
          }
          .download-tech-details {
            flex-direction: column;
            gap: 12px;
            padding: 14px 16px;
            width: 100%;
          }
          .download-action {
            width: 100%;
            margin-top: 4px;
          }
          .download-btn {
            width: 100%;
            justify-content: center;
            padding: 12px 20px;
          }
        }
      `}</style>
    </PageWrapper>
  );
}
