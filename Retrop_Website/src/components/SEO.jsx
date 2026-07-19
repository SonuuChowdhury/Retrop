// ============================================================================
// SEO COMPONENT — Dynamic Head Metadata, Open Graph, Twitter Cards, & JSON-LD
// ============================================================================

import React, { useEffect } from 'react';

const DEFAULT_TITLE = 'Retrop — Restaurant Management System & POS Software';
const DEFAULT_DESC = 'Retrop RMS is an all-in-one restaurant management system built for Indian restaurants, cloud kitchens, and cafés. Manage inventory, menu costs, QR ordering, waiters, and real-time analytics.';
const SITE_URL = 'https://retrop.in';
const DEFAULT_IMAGE = `${SITE_URL}/logo-corner-rounded.png`;

export default function SEO({
  title,
  description = DEFAULT_DESC,
  pathname = '',
  image = DEFAULT_IMAGE,
  type = 'website',
  schemaData = null
}) {
  const fullTitle = title ? `${title} — Retrop` : DEFAULT_TITLE;
  const canonicalUrl = `${SITE_URL}${pathname}`;

  useEffect(() => {
    // 1. Title
    document.title = fullTitle;

    // Helper to set or create meta tag
    const setMetaTag = (selector, attrName, attrValue, content) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to set canonical link
    const setCanonical = (url) => {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', url);
    };

    // 2. Standard Meta Tags
    setMetaTag('meta[name="description"]', 'name', 'description', description);
    setMetaTag('meta[name="robots"]', 'name', 'robots', 'index, follow');
    setCanonical(canonicalUrl);

    // 3. Open Graph Tags
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', type);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', image);
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Retrop');

    // 4. Twitter Card Tags
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', image);

    // 5. Structured JSON-LD Schema
    const schemaId = 'retrop-jsonld-schema';
    let scriptTag = document.getElementById(schemaId);
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = schemaId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const defaultSchema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'Retrop RMS',
      'operatingSystem': 'Web, Android',
      'applicationCategory': 'BusinessApplication',
      'url': SITE_URL,
      'description': DEFAULT_DESC,
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'INR'
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'Retrop',
        'url': SITE_URL,
        'logo': DEFAULT_IMAGE
      }
    };

    scriptTag.text = JSON.stringify(schemaData || defaultSchema);
  }, [fullTitle, description, canonicalUrl, image, type, schemaData]);

  return null;
}
