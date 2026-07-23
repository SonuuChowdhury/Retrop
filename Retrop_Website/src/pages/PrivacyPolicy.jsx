// ============================================================================
// PRIVACY POLICY (/privacy-policy)
// ============================================================================

import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageWrapper from '../components/PageWrapper';

export default function PrivacyPolicy() {
  return (
    <PageWrapper title="Privacy Policy">
      <Navbar />
      <main style={{ flex: 1 }}>
        <div className="legal-content">
          <h1>Privacy Policy</h1>
          <p className="legal-meta">Last updated: July 23, 2026 · Retrop</p>

          <p>
            At Retrop ("we", "our", "us"), operated by Sonu Chowdhury, an individual proprietor based in
            West Bengal, India, we are committed to protecting the privacy and security of
            the personal information we collect from our users. This Privacy Policy explains how we collect,
            use, store, and share information when you use our website, mobile app, and business tools
            (collectively, "Services").
          </p>
          <p>
            By using our Services, you agree to the collection and use of information as described in this policy.
          </p>

          <h2>1. Information We Collect</h2>
          <h3>1.1 Information you provide directly</h3>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, mobile number, business name, address</li>
            <li><strong>Staff Information:</strong> Names and contact details of staff accounts you create</li>
            <li><strong>Business Information:</strong> GST number, operating details, inventory data, vendor contacts</li>
            <li><strong>Financial Data:</strong> Revenue figures, cost data, purchase records (stored within your account)</li>
            <li><strong>Communications:</strong> Messages sent to our support team</li>
          </ul>

          <h3>1.2 Information collected automatically (Visitor Analytics & Telemetry)</h3>
          <p>
            When you visit or navigate our website, our server and automated analytics systems collect standard web telemetry data to measure performance, optimize user experience, and ensure security:
          </p>
          <ul>
            <li><strong>Visitor Analytics:</strong> Unique visitor identifier tokens, returning visitor status, total pageviews, session duration, entry page, exit page, and bounce rate metrics.</li>
            <li><strong>Device & System Specifications:</strong> Device category (Mobile, Tablet, Desktop), web browser type and version, operating system, screen resolution, system timezone, and network connection type.</li>
            <li><strong>Network & Geographic Location:</strong> IP address (anonymized/hashed where applicable), estimated country, state, city, and Internet Service Provider (ISP).</li>
            <li><strong>Traffic Source & Referral Data:</strong> Referring channel (Search engines such as Google, direct visits, social channels like Facebook, Instagram, LinkedIn, Twitter/X, or referral websites) and UTM campaign parameters (source, medium, campaign name).</li>
            <li><strong>Log Data & Cookies:</strong> Server logs including request timestamps, system errors, API call latency, and essential session storage identifiers.</li>
          </ul>

          <h3>1.3 Customer order data</h3>
          <p>
            When your customers place orders through our digital ordering system, we collect
            their order details (items, table/counter reference, special instructions).
            For orders placed by end-customers/diners through a restaurant's QR ordering page, Retrop
            processes this data solely on behalf of, and under the instructions of, the respective
            restaurant business, which remains responsible for such data as the data fiduciary under
            applicable law, including the Digital Personal Data Protection Act, 2023.
            This data is attributed to your business account and is not used for any purpose beyond operating your ordering system.
          </p>

          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>To provide, maintain, and continuously optimize our Services</li>
            <li>To process and fulfil orders placed through the system</li>
            <li>To analyze website performance, measure traffic sources, and evaluate marketing campaign effectiveness</li>
            <li>To authenticate users and manage account security</li>
            <li>To send you service-related communications (billing, support, updates)</li>
            <li>To generate analytics and operational reports within your account</li>
            <li>To detect, investigate, and prevent fraud, unauthorized access, or security incidents</li>
            <li>To comply with legal obligations</li>
          </ul>
          <p>We do <strong>not</strong> sell your personal data or visitor analytics to third parties. We do not monetize your data for external advertising networks.</p>

          <h2>3. Data Storage, Security & Transfers</h2>
          <p>
            Your data is stored on secure servers. We use industry-standard encryption
            (TLS/SSL) for all data in transit, and AES-256 encryption for data at rest.
          </p>
          <p>
            Access to your data is restricted to authorized Retrop personnel who need it to provide
            our Services. All access is logged and audited.
          </p>
          <p>
            We perform regular security assessments and maintain security best practices in accordance
            with applicable data protection standards, including the Digital Personal Data Protection Act, 2023.
          </p>
          <p>
            <strong>Cross-Border Data Transfers:</strong> Your data may be stored and processed on secure servers located in India or other jurisdictions, subject to appropriate technical, organizational, and contractual safeguards under applicable law, including the Digital Personal Data Protection Act, 2023.
          </p>

          <h2>4. Data Sharing</h2>
          <p>We may share your information with:</p>
          <ul>
            <li><strong>Service Providers:</strong> Hosting infrastructure, email delivery, and analytics tools used to operate the platform</li>
            <li><strong>Legal Authorities:</strong> Where required by law, court order, or government regulation</li>
            <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred to the acquiring entity</li>
          </ul>

          <h2>5. Data Retention</h2>
          <p>
            We retain your account data for as long as your account is active. Upon account termination:
          </p>
          <ul>
            <li>Active account data is deactivated immediately</li>
            <li>Data is retained for 90 days to allow recovery if the termination was accidental</li>
            <li>After 90 days, data is permanently deleted from our systems</li>
          </ul>
          <p>
            Some data may be retained longer where required by law (e.g., financial transaction records for GST compliance).
          </p>

          <h2>6. Your Rights</h2>
          <p>
            Under applicable data protection laws, including the Digital Personal Data Protection Act, 2023, you have the right to:
          </p>
          <ul>
            <li><strong>Access</strong> — Request a copy of the personal data we hold about you</li>
            <li><strong>Correction</strong> — Request correction of inaccurate data</li>
            <li><strong>Deletion</strong> — Request deletion of your account and associated data</li>
            <li><strong>Portability</strong> — Request your data in a machine-readable format</li>
            <li><strong>Restriction</strong> — Request that we limit how we process your data</li>
          </ul>
          <p>To exercise any of these rights, contact us through our <a href="/contact" style={{ color: 'var(--color-primary)' }}>Contact page</a> or email our Grievance Officer directly.</p>

          <h2>7. Children's Privacy</h2>
          <p>
            Our Services are not directed to individuals under the age of 18. We do not knowingly collect
            personal information from children. If you believe we have collected information from a minor,
            please contact us immediately.
          </p>

          <h2>8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. We will notify you of significant changes
            by email or by displaying a notice in your dashboard. Continued use of the Services
            after changes take effect constitutes acceptance of the updated policy.
          </p>

          <h2>9. Contact & Grievance Officer</h2>
          <p>
            Retrop is operated by Sonu Chowdhury, an individual proprietor based in West Bengal, India.
          </p>
          <p>
            For privacy-related questions, data rights requests, or grievances, contact us through our{' '}
            <a href="/contact" style={{ color: 'var(--color-primary)' }}>Contact page</a> or reach out directly to our Grievance Officer:<br />
            <strong>Grievance Officer:</strong> Sonu Chowdhury<br />
            <strong>Email:</strong> <a href="mailto:chowdhurysonu047@gmail.com" style={{ color: 'var(--color-primary)' }}>chowdhurysonu047@gmail.com</a><br />
            <strong>Location:</strong> Retrop, West Bengal, India
          </p>
        </div>
      </main>
      <Footer />
    </PageWrapper>
  );
}
