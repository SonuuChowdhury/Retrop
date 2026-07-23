// ============================================================================
// TERMS OF SERVICE (/terms-of-service)
// ============================================================================

import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageWrapper from '../components/PageWrapper';

export default function TermsOfService() {
  return (
    <PageWrapper title="Terms of Service">
      <Navbar />
      <main style={{ flex: 1 }}>
        <div className="legal-content">
          <h1>Terms of Service</h1>
          <p className="legal-meta">Last updated: July 23, 2026 · Retrop</p>

          <p>
            These Terms of Service ("Terms") govern your access to and use of the Retrop platform,
            including the website at retrop.in, the Retrop RMS mobile app, the management tools,
            and the ordering system (collectively, "Services") operated by Sonu Chowdhury, an individual
            proprietor trading as Retrop ("Retrop", "we", "us"), based in West Bengal, India.
          </p>
          <p>
            By accessing or using our Services, you agree to be bound by these Terms. If you do not agree,
            please do not use our Services.
          </p>

          <h2>1. Terms of Use</h2>
          <h3>1.1 Eligibility</h3>
          <p>
            You must be at least 18 years old and legally authorized to operate a business to create
            an account. By registering, you confirm that the information you provide is accurate and complete.
          </p>
          <h3>1.2 Account Responsibility</h3>
          <p>
            You are responsible for maintaining the confidentiality of your login credentials. All activities
            that occur under your account are your responsibility. Notify us immediately through our{' '}
            <a href="/contact" style={{ color: 'var(--color-primary)' }}>Contact page</a> if
            you suspect unauthorized access.
          </p>
          <h3>1.3 Acceptable Use</h3>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Services for any unlawful purpose or in violation of any applicable law</li>
            <li>Attempt to gain unauthorized access to any part of the Services or related systems</li>
            <li>Reverse engineer, decompile, or disassemble any part of the software</li>
            <li>Upload malicious code, viruses, or any harmful software</li>
            <li>Use the Services to transmit spam, misleading information, or harmful content</li>
            <li>Resell or sublicense the Services without prior written consent from Retrop</li>
            <li>Scrape, crawl, or harvest data from the Services in an automated manner</li>
          </ul>

          <h2>2. Payment Terms</h2>
          <h3>2.1 Subscription Fees & Plans</h3>
          <p>
            Access to Retrop RMS is provided on a prepaid subscription basis (Monthly Plan) or via a one-time payment (Lifetime Plan).
            Pricing plans and fees are communicated at onboarding and listed on our website. Fees may be updated with 30 days' notice to existing subscribers.
          </p>
          <h3>2.2 Billing Cycle & Grace Period</h3>
          <p>
            Monthly subscriptions operate on a 28-day prepaid billing cycle. Each 28-day cycle includes an additional 10-day grace period, providing a total active access window of 38 days per cycle. For the Lifetime Plan, billing occurs as a single, one-time payment upon sign-up granting permanent platform access.
          </p>
          <h3>2.3 Payment Methods</h3>
          <p>
            We accept UPI, net banking, credit/debit cards, and other payment methods as made available.
            All payments are processed securely through PCI-DSS compliant payment gateways.
          </p>
          <h3>2.4 Renewal & Service Suspension</h3>
          <p>
            If a subscription payment is not renewed prior to the end of the 10-day grace period (38 days after cycle start), access to the Services may be temporarily suspended until payment is received.
          </p>
          <h3>2.5 Add-on Services</h3>
          <p>
            Optional add-on services (such as Website Personalisation & QR Setup, incident-based Tech Support, and printed QR Table Cards) are charged separately. Full details and current prices for all plans and add-on services are available on our <a href="/services" style={{ color: 'var(--color-primary)' }}>Pricing & Services page</a>.
          </p>

          <h2>3. Refund Policy</h2>
          <p>
            Any payment made is non-refundable once the payment has been completed. Specifically:
          </p>
          <ul>
            <li><strong>Lifetime Plan:</strong> The ₹13,999 one-time fee is strictly non-refundable once paid, given its permanent-access nature.</li>
            <li><strong>Physical Goods:</strong> Printed or dispatched physical goods (such as printed QR table cards) are non-refundable and non-exchangeable once printed.</li>
            <li><strong>Subscription Fees & Add-ons:</strong> All prepaid monthly subscription fees and completed add-on service fees are non-refundable.</li>
          </ul>


          <h2>4. Cancellation Policy</h2>
          <h3>4.1 Cancellation by you</h3>
          <p>
            You may cancel your subscription at any time by contacting us through our{' '}
            <a href="/contact" style={{ color: 'var(--color-primary)' }}>Contact page</a> or
            through the Account Settings section of your dashboard.
          </p>
          <ul>
            <li>Cancellation takes effect at the end of the current billing cycle</li>
            <li>You retain access to the Services until the period you have paid for expires</li>
            <li>No partial refunds are provided for the remaining subscription period</li>
            <li>Your data is retained for 90 days after account closure, then permanently deleted</li>
          </ul>
          <h3>4.2 Cancellation by Retrop</h3>
          <p>
            We reserve the right to suspend or terminate accounts that violate these Terms, with or without
            prior notice. In cases of intentional misuse, no refund will be provided.
          </p>

          <h2>5. User Responsibilities</h2>
          <p>As a Retrop user, you are responsible for:</p>
          <ul>
            <li>Ensuring your use of the Services complies with all applicable laws and compliance requirements</li>
            <li>The accuracy of data you enter into the platform (workflows, prices, inventory, staff records)</li>
            <li>Managing staff access and ensuring your team uses the platform appropriately</li>
            <li>Keeping your business profile information current and accurate</li>
            <li>Securing the devices used to access the portal and mobile app</li>
            <li>Not sharing your credentials with unauthorized individuals</li>
          </ul>
          <p>
            Retrop is a tool to assist your operations — you remain responsible for all business decisions
            made based on information provided by the platform.
          </p>

          <h2>6. Intellectual Property</h2>
          <p>
            All content, code, design, trademarks, and intellectual property associated with the Retrop
            Services are the exclusive property of Retrop. You are granted a
            limited, non-exclusive, non-transferable license to use the Services for their intended purpose.
          </p>
          <p>
            Your business data (menus, workflow records, inventory records, revenue data) remains your property.
            By using our Services, you grant us a limited license to store and process this data
            to provide the Services.
          </p>

          <h2>7. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, Retrop shall not be
            liable for:
          </p>
          <ul>
            <li>Any indirect, incidental, special, consequential, or punitive damages</li>
            <li>Loss of profits, revenue, data, goodwill, or business opportunities</li>
            <li>Damages resulting from unauthorized access to your account due to your failure to maintain credential security</li>
            <li>Losses due to third-party payment processor failures or outages</li>
            <li>Business decisions made based on data or reports generated by the platform</li>
            <li>Interruptions or outages caused by force majeure events</li>
          </ul>
          <p>
            Our total aggregate liability to you for any claim arising out of or relating to these Terms
            or the Services shall not exceed the amount you paid to Retrop in the 3 months preceding the claim.
          </p>

          <h2>8. Disclaimer of Warranties</h2>
          <p>
            The Services are provided "as is" and "as available" without warranties of any kind, whether
            express or implied. We do not warrant that the Services will be uninterrupted, error-free,
            or completely secure.
          </p>

          <h2>9. Governing Law</h2>
          <p>
            These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive
            jurisdiction of the courts located in India.
          </p>

          <h2>10. Changes to Terms</h2>
          <p>
            We may update these Terms periodically. We will notify you of material changes via email
            or a notice in the portal at least 14 days before the changes take effect.
            Continued use of the Services after changes take effect constitutes acceptance.
          </p>

          <h2>11. Contact & Grievance Officer</h2>
          <p>
            Retrop is operated by Sonu Chowdhury, an individual proprietor based in West Bengal, India.
          </p>
          <p>
            For questions or concerns regarding these Terms, contact us through our{' '}
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
