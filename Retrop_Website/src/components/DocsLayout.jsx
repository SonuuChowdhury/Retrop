// ============================================================================
// DOCS LAYOUT — Wraps all documentation pages with PageWrapper + Navbar + Sidebar + Footer
// ============================================================================

import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import DocsSidebar from './DocsSidebar';
import PageWrapper from './PageWrapper';

export default function DocsLayout({ children, title = 'Docs' }) {
  return (
    <PageWrapper title={title}>
      <Navbar />

      <div className="docs-layout" style={{ flex: 1 }}>
        <DocsSidebar />
        <main className="docs-content" id="docs-main" style={{ padding: '32px', animation: 'fadeIn 0.35s ease both' }}>
          {children}
        </main>
      </div>

      <Footer />
    </PageWrapper>
  );
}
