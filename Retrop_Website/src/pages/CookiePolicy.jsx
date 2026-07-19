// ============================================================================
// COOKIE POLICY (/cookie-policy)
// ============================================================================

import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageWrapper from '../components/PageWrapper';

export default function CookiePolicy() {
  return (
    <PageWrapper title="Cookie Policy">
      <Navbar />
      <main style={{ flex: 1 }}>
        <div className="legal-content">
          <h1>Cookie Policy</h1>
          <p className="legal-meta">Last updated: July 2025 · Retrop</p>

          <p>
            This Cookie Policy explains what cookies are, how Retrop ("Retrop", "we")
            uses them on our website (retrop.in) and Services, and how you can control your cookie preferences.
          </p>

          <h2>1. What Are Cookies?</h2>
          <p>
            Cookies are small text files that are stored on your device (computer, phone, or tablet) when you
            visit a website. They help the website recognize your device on future visits, remember your preferences,
            and enable certain functionality.
          </p>
          <p>
            Cookies cannot be used to run programs or deliver viruses to your device. They are uniquely assigned
            to you and can only be read by the web server in the domain that issued the cookie.
          </p>

          <h2>2. Types of Cookies We Use</h2>

          <h3>2.1 Strictly Necessary Cookies</h3>
          <p>
            These cookies are essential for the website and dashboard to function. Without them, you
            cannot log in, navigate the portal, or use core features. These cookies cannot be disabled.
          </p>
          <ul>
            <li><strong>Session Cookie</strong> — Keeps you logged in during your browsing session</li>
            <li><strong>CSRF Token</strong> — Protects against cross-site request forgery attacks</li>
            <li><strong>Authentication Token</strong> — Securely identifies your logged-in session</li>
          </ul>

          <h3>2.2 Preference Cookies</h3>
          <p>
            These cookies remember your settings and preferences to enhance your experience across visits.
          </p>
          <ul>
            <li><strong>Theme Preference</strong> — Remembers whether you've selected Light or Dark mode</li>
            <li><strong>Language Preference</strong> — Stores your selected language for the interface</li>
            <li><strong>Dashboard Layout</strong> — Remembers collapsed/expanded sidebar state</li>
          </ul>

          <h3>2.3 Analytics & Performance Telemetry</h3>
          <p>
            We use privacy-first, first-party analytics tokens and local storage identifiers (`retrop_vid` and `retrop_sid`) to understand visitor traffic, measure session durations, and evaluate marketing campaigns:
          </p>
          <ul>
            <li><strong>Visitor Identifier (`retrop_vid`):</strong> A persistent, pseudo-anonymous token stored in localStorage to calculate unique and returning visitor ratios.</li>
            <li><strong>Session Token (`retrop_sid`):</strong> A temporary browser session token used to calculate active session duration, entry pages, and exit pages.</li>
            <li><strong>Traffic & Referral Tracking:</strong> Logs traffic sources (Google, Direct, Facebook, Instagram, LinkedIn, Twitter/X, Referral links) and campaign UTM parameters.</li>
            <li><strong>Device Telemetry:</strong> Anonymized device category (Mobile/Tablet/Desktop), browser type, operating system, screen resolution, timezone, and network type.</li>
          </ul>
          <p>
            All analytics data is stored securely on our backend servers and database. We do not sell analytics data to external advertising networks or data brokers.
          </p>

          <h3>2.4 Functional Cookies</h3>
          <p>
            These cookies enable enhanced functionality within the dashboard, such as remembering
            your last active tab, recently viewed sections, and filter preferences in tables and reports.
          </p>

          <h2>3. Third-Party Cookies</h2>
          <p>
            Some cookies on our Services are set by trusted third-party services we use to operate the platform:
          </p>
          <ul>
            <li><strong>Payment Processors</strong> — May set cookies when you complete a billing transaction</li>
            <li><strong>Customer Support Tools</strong> — Used by our support chat widget</li>
          </ul>
          <p>
            We do not use third-party advertising cookies or allow ad networks to track you through our website.
          </p>

          <h2>4. Cookie Duration</h2>
          <ul>
            <li><strong>Session cookies</strong> — Expire when you close your browser</li>
            <li><strong>Persistent cookies</strong> — Remain on your device for a set period (typically 7–30 days, depending on the cookie)</li>
            <li><strong>Authentication tokens</strong> — Expire after 7 days of inactivity, requiring re-login</li>
          </ul>

          <h2>5. How to Control Cookies</h2>
          <h3>5.1 Browser settings</h3>
          <p>
            Most web browsers allow you to control cookies through their settings. You can:
          </p>
          <ul>
            <li>View cookies stored on your device</li>
            <li>Block all or specific cookies</li>
            <li>Delete cookies from your device</li>
          </ul>
          <p>
            Please note that blocking strictly necessary cookies will prevent you from logging in and using
            core features of the dashboard.
          </p>
          <h3>5.2 Browser-specific guides</h3>
          <ul>
            <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site data</li>
            <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
            <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
            <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
          </ul>

          <h2>6. Do Not Track</h2>
          <p>
            Some browsers include a "Do Not Track" (DNT) signal. As there is no industry standard for how
            websites should respond to DNT signals, we do not currently alter our data practices in response
            to them. We do, however, maintain privacy-first practices regardless.
          </p>

          <h2>7. Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy as our Services evolve or as regulations change. We will
            post the updated policy on this page with a revised "Last updated" date.
          </p>

          <h2>8. Contact</h2>
          <p>
            For questions about our use of cookies, reach us through our{' '}
            <a href="/contact" style={{ color: 'var(--color-primary)' }}>Contact page</a> or at:<br />
            <strong>chowdhurysonu047@gmail.com</strong><br />
            Retrop, India
          </p>
        </div>
      </main>
      <Footer />
    </PageWrapper>
  );
}
