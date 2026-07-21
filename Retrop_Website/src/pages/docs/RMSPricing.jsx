// ============================================================================
// RMS PRICING DOC (/docs/rms/pricing)
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import DocsLayout from '../../components/DocsLayout';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldCheck,
  Globe,
  Headphones,
  Printer,
  Calendar,
  Zap,
  HelpCircle,
  ArrowRight,
  Info
} from 'lucide-react';

export default function RMSPricing() {
  return (
    <DocsLayout title="Pricing — Retrop RMS Docs">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '32px' }}>
        <Link to="/docs" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Docs</Link>
        <span>›</span>
        <Link to="/docs/rms" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Retrop RMS</Link>
        <span>›</span>
        <span style={{ color: 'var(--color-text)' }}>Pricing</span>
      </div>

      <span className="badge badge-primary" style={{ marginBottom: '16px' }}>Retrop RMS</span>
      <h1>Pricing & Subscription Plans</h1>
      <p style={{ fontSize: '17px', color: 'var(--color-text)', marginBottom: '32px', lineHeight: 1.7 }}>
        Transparent, flexible pricing engineered for restaurants and cafés of all sizes. Choose between our monthly prepaid model or unlock maximum savings with our all-inclusive Lifetime Plan.
      </p>

      {/* TOC */}
      <div className="docs-toc">
        <h4>On this page</h4>
        <ul>
          <li><a href="#subscription-plans">Subscription Plans</a></li>
          <li><a href="#plan-comparison">Detailed Plan Comparison</a></li>
          <li><a href="#addons-services">Add-on Services & Printing</a></li>
          <li><a href="#table-cards-policy">Table Cards Ordering Policy</a></li>
        </ul>
      </div>

      {/* Pricing Cards Grid */}
      <h2 id="subscription-plans">Subscription Plans</h2>
      <p>
        We offer two flexible options depending on your business goals and cash flow preferences.
      </p>

      <div className="pricing-plans-grid">
        
        {/* Monthly Plan Card */}
        <div className="pricing-card monthly">
          <div>
            <span className="badge badge-muted" style={{ fontSize: '11px', padding: '2px 8px' }}>Regular Cycle</span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginTop: '8px', marginBottom: '4px' }}>Monthly Subscription</h3>
            <p className="plan-subtitle" style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>Prepaid 28-day cycle with 10 days extended validity grace period.</p>
          </div>

          {/* Pricing strike-through */}
          <div className="pricing-price-box monthly">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
              <span className="slashed-price" style={{ fontSize: '14px', color: 'var(--color-text-muted)', textDecoration: 'line-through', fontWeight: 600 }}>₹1,499</span>
              <span className="real-price" style={{ fontSize: '28px', fontWeight: 900, color: 'var(--color-text)' }}>₹899</span>
              <span className="price-unit" style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>/ 28 Days</span>
            </div>
            <div className="validity-note" style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={12} /> 28 + 10 Days (38 Days Total) Active License
            </div>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={15} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>Full RMS Mobile App & Owner Portal Access</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={15} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>Real-time inventory & stock tracking</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <XCircle size={15} color="var(--color-text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Website Dev:</strong> ₹999 setup fee required</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <XCircle size={15} color="var(--color-text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Tech Support:</strong> ₹499 per incident</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <XCircle size={15} color="var(--color-text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Table Cards:</strong> Standard rate (₹399 / 5 cards)</span>
            </li>
          </ul>

          <Link to="/contact" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', textAlign: 'center', padding: '10px 12px' }}>
            Get Monthly Plan
          </Link>
        </div>

        {/* Lifetime Plan Card (Featured) */}
        <div className="pricing-card lifetime">
          {/* Badge */}
          <div className="pricing-badge-popular">
            <Sparkles size={12} /> BEST VALUE
          </div>

          <div>
            <span className="badge badge-primary" style={{ fontSize: '11px', padding: '2px 8px' }}>One-Time Payment</span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginTop: '8px', marginBottom: '4px' }}>Lifetime Plan</h3>
            <p className="plan-subtitle" style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>Pay once, use forever with zero recurring fees and full benefits.</p>
          </div>

          {/* Pricing strike-through */}
          <div className="pricing-price-box lifetime">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
              <span className="slashed-price" style={{ fontSize: '14px', color: 'var(--color-text-muted)', textDecoration: 'line-through', fontWeight: 600 }}>₹24,999</span>
              <span className="real-price" style={{ fontSize: '28px', fontWeight: 900, color: 'var(--color-primary)' }}>₹13,999</span>
              <span className="price-unit" style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 700 }}>One-Time</span>
            </div>
            <div className="validity-note" style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Zap size={12} /> Unlimited lifetime access — Never pay renewals
            </div>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={15} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Free Lifetime Tech Support:</strong> Included (₹0 extra)</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={15} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Zero Monthly Charges:</strong> Permanent license</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={15} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Website Development:</strong> Included (₹0 extra)</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={15} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span><strong>10 Table Cards Included:</strong> Printed & delivered</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={15} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>Priority feature updates & dedicated support</span>
            </li>
          </ul>

          <Link to="/contact" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', textAlign: 'center', padding: '10px 12px', boxShadow: '0 6px 20px rgba(255,107,53,0.3)' }}>
            Get Lifetime Access <ArrowRight size={14} />
          </Link>
        </div>

      </div>

      {/* License Validity Callout */}
      <div className="docs-callout tip" style={{ margin: '24px 0 40px' }}>
        <ShieldCheck size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <p style={{ margin: 0 }}><strong>28 + 10 Days Grace Period (Monthly Subscription):</strong></p>
          <p style={{ margin: '4px 0 0', fontSize: '13.5px', lineHeight: 1.6 }}>
            Every monthly payment covers a standard 28-day billing cycle plus an additional <strong>10 grace days</strong> (totaling 38 days of system access per payment). This guarantees your restaurant operations run uninterrupted even during payment processing delays.
          </p>
        </div>
      </div>

      {/* Add-on Services Breakdown */}
      <h2 id="addons-services">Add-on Services & Costs</h2>
      <p>
        Detailed pricing breakdown for individual add-ons, customization services, technical support, and physical marketing materials.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', margin: '24px 0 40px' }}>
        
        <div style={{ padding: '16px', background: 'var(--color-bg-subtle)', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Globe size={16} color="var(--color-primary)" />
            <strong style={{ fontSize: '14px' }}>Website Personalisation</strong>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, margin: '6px 0 4px', color: 'var(--color-text)' }}>₹999 <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-muted)' }}>/ setup</span></div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
            Custom QR ordering website setup. (Free in Lifetime Plan).
          </p>
        </div>

        <div style={{ padding: '16px', background: 'var(--color-bg-subtle)', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Headphones size={16} color="var(--color-primary)" />
            <strong style={{ fontSize: '14px' }}>Tech Support (Incidents)</strong>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, margin: '6px 0 4px', color: 'var(--color-text)' }}>₹499 <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-muted)' }}>/ incident</span></div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
            Dedicated technical support & fixes. (Free in Lifetime Plan).
          </p>
        </div>

        <div style={{ padding: '16px', background: 'var(--color-bg-subtle)', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Printer size={16} color="var(--color-primary)" />
            <strong style={{ fontSize: '14px' }}>Table Card Printing</strong>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, margin: '6px 0 4px', color: 'var(--color-text)' }}>₹399 <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-muted)' }}>/ 5 cards pack</span></div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
            Printed QR table cards. Sold in 5-card pack batches.
          </p>
        </div>

      </div>

      {/* Table Cards Ordering Policy */}
      <h2 id="table-cards-policy">Table Cards Ordering & Batch Policy</h2>
      <p>
        Table card printing is supplied in standard production packs of <strong>5 cards per pack at ₹399</strong>. Orders are processed in full pack increments.
      </p>

      <div className="docs-callout warning" style={{ margin: '20px 0 32px' }}>
        <Info size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <p style={{ margin: 0 }}><strong>Important Calculation Rule for Table Cards:</strong></p>
          <p style={{ margin: '6px 0 0', fontSize: '13.5px', lineHeight: 1.6 }}>
            If your business requires a custom number of cards (e.g. 7 cards), printing is calculated by rounding up to the next full pack of 5. For 7 cards, you will need 2 packs (10 cards total), which amounts to <strong>₹399 × 2 = ₹798</strong>.
          </p>
          <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '12.5px', lineHeight: 1.6 }}>
            <li><strong>1 to 5 Cards:</strong> 1 Pack = ₹399 (you receive 5 cards)</li>
            <li><strong>6 to 10 Cards:</strong> 2 Packs = ₹798 (you receive 10 cards)</li>
            <li><strong>11 to 15 Cards:</strong> 3 Packs = ₹1,197 (you receive 15 cards)</li>
          </ul>
        </div>
      </div>

      {/* Detailed Comparison Table */}
      <h2 id="plan-comparison">Detailed Plan Comparison</h2>
      <p>Compare the features and inclusions of each plan side by side:</p>

      <div className="pricing-table-wrapper">
        <table className="pricing-table">
          <thead>
            <tr>
              <th>Feature / Service</th>
              <th>Monthly Plan (₹899)</th>
              <th style={{ color: 'var(--color-primary)' }}>Lifetime Plan (₹13,999)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 600 }}>Billing Cycle</td>
              <td style={{ color: 'var(--color-text-muted)' }}>28 Days (+10 Days Grace)</td>
              <td style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Lifetime One-Time</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Website Personalisation</td>
              <td style={{ color: 'var(--color-text-muted)' }}>₹999 Setup Fee</td>
              <td style={{ color: '#10B981', fontWeight: 700 }}>Included (₹0 Extra)</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Tech Support (Incidents)</td>
              <td style={{ color: 'var(--color-text-muted)' }}>₹499 / Incident</td>
              <td style={{ color: '#10B981', fontWeight: 700 }}>Free Unlimited Support</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Table Cards Included</td>
              <td style={{ color: 'var(--color-text-muted)' }}>Standard Rate (₹399/5)</td>
              <td style={{ color: '#10B981', fontWeight: 700 }}>10 Free Cards Included</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>RMS Mobile &amp; Portal</td>
              <td style={{ color: 'var(--color-text)' }}>Full Access</td>
              <td style={{ color: 'var(--color-text)', fontWeight: 700 }}>Full Access + Priority</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>QR Digital Ordering</td>
              <td style={{ color: 'var(--color-text)' }}>Full Access</td>
              <td style={{ color: 'var(--color-text)', fontWeight: 700 }}>Full Access</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* FAQ */}
      <h2 id="faq">Frequently Asked Questions</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '24px 0 48px' }}>
        {[
          {
            q: 'What happens after the 28 days of my Monthly Subscription?',
            a: 'You get an automatic 10-day grace period (totaling 38 days of active access). You can renew your subscription anytime during this period to keep your service seamless.'
          },
          {
            q: 'Why is there a ₹999 Website Personalisation fee on the Monthly plan?',
            a: 'The ₹999 fee covers custom domain setup, hosting configuration, branding, and setting up your dedicated QR code ordering web app. In the Lifetime Plan, this setup charge is completely waived.'
          },
          {
            q: 'What is counted as a Tech Support Incident?',
            a: 'An incident is any requested intervention where our technical team helps fix corrupted menu entries, data restoration, network re-configurations, or issues resulting from user side changes. Lifetime Plan users get unlimited incident support for free.'
          },
          {
            q: 'How are table card shipping and extra cards handled?',
            a: 'Table cards are printed on premium durable materials with high-res QR codes. The Lifetime Plan includes 10 free cards. Additional cards or cards for Monthly plan users are ordered in packs of 5 for ₹399.'
          }
        ].map(({ q, a }) => (
          <div key={q} style={{ padding: '20px', borderRadius: '14px', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 8px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={16} color="var(--color-primary)" /> {q}
            </h4>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.65 }}>
              {a}
            </p>
          </div>
        ))}
      </div>

      {/* CTA Footer */}
      <div style={{
        marginTop: '48px',
        padding: '36px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(255,107,53,0.1), rgba(255,154,60,0.05))',
        border: '1.5px solid rgba(255,107,53,0.25)',
        textAlign: 'center'
      }}>
        <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '10px' }}>Ready to transform your restaurant?</h3>
        <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', marginBottom: '24px', maxWidth: '540px', margin: '0 auto 24px' }}>
          Contact our sales team today to get your custom demo, set up your restaurant profile, or choose your plan.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/contact" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '15px' }}>
            Get Started Now <ArrowRight size={16} />
          </Link>
          <Link to="/docs/rms" className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '15px' }}>
            Explore RMS Documentation
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
}
