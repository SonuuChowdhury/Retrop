// ============================================================================
// DOCS SIDEBAR — Sticky left navigation for documentation pages
// ============================================================================

import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Smartphone, ShoppingCart, LayoutDashboard } from 'lucide-react';

const docsSections = [
  {
    label: 'Retrop RMS',
    links: [
      { to: '/docs/rms',          label: 'Overview',        icon: BookOpen        },
      { to: '/docs/rms/app',      label: 'Mobile App',      icon: Smartphone      },
      { to: '/docs/rms/ordering', label: 'Ordering System', icon: ShoppingCart    },
      { to: '/docs/rms/portal',   label: "Owner's Portal",  icon: LayoutDashboard },
    ],
  },
];

export default function DocsSidebar() {
  return (
    <aside className="docs-sidebar" aria-label="Documentation navigation">
      <div style={{ padding: '0 24px 20px', borderBottom: '1px solid var(--color-border)', marginBottom: '16px' }}>
        <NavLink
          to="/docs"
          end
          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', color: 'var(--color-text)', textDecoration: 'none' }}
        >
          <BookOpen size={16} style={{ color: 'var(--color-primary)' }} />
          Documentation
        </NavLink>
      </div>

      {docsSections.map((section) => (
        <div key={section.label} className="docs-sidebar-section">
          <span className="docs-sidebar-label">{section.label}</span>
          {section.links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                ['docs-sidebar-link', isActive ? 'active' : ''].filter(Boolean).join(' ')
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </div>
      ))}
    </aside>
  );
}
