import React from 'react'
import { useInView } from '../../hooks/useInView.js'
import './Location.css'

export default function Location({ location, contact }) {
  const { ref: headerRef, inView: headerInView } = useInView()
  const { ref: mapRef,    inView: mapInView    } = useInView()
  const { ref: infoRef,   inView: infoInView   } = useInView()

  const encoded = encodeURIComponent(contact.address)
  const mapsUrl = location.googleMapsDirectionsUrl || `https://maps.google.com?q=${encoded}`

  return (
    <section className="location g-section" id="location" aria-label="Location and map">
      <div className="g-container">

        <header
          ref={headerRef}
          className={`location__header g-reveal ${headerInView ? 'g-reveal--visible' : ''}`}
        >
          <span className="g-section-label">Find Us</span>
          <h2 className="location__heading">
            Come Visit<br /><em>Our Home</em>
          </h2>
        </header>

        <div className="location__body">

          {/* MAP CARD */}
          <div
            ref={mapRef}
            className={`location__map-card g-reveal g-reveal--delay-1 ${mapInView ? 'g-reveal--visible' : ''}`}
          >
            <div className="location__map-illustration">
              <svg viewBox="0 0 480 300" xmlns="http://www.w3.org/2000/svg">
                <rect width="480" height="300" fill="#1c2b3a"/>

                <line x1="0" y1="80"  x2="480" y2="80"  stroke="#2a3e54" strokeWidth="12"/>
                <line x1="0" y1="160" x2="480" y2="160" stroke="#2a3e54" strokeWidth="16"/>
                <line x1="0" y1="240" x2="480" y2="240" stroke="#2a3e54" strokeWidth="10"/>
                <line x1="120" y1="0" x2="120" y2="300" stroke="#2a3e54" strokeWidth="10"/>
                <line x1="260" y1="0" x2="260" y2="300" stroke="#2a3e54" strokeWidth="14"/>
                <line x1="390" y1="0" x2="390" y2="300" stroke="#2a3e54" strokeWidth="8"/>

                <rect x="8"   y="8"   width="106" height="66" rx="4" fill="#253545"/>
                <rect x="130" y="8"   width="124" height="66" rx="4" fill="#2b3e52"/>
                <rect x="270" y="8"   width="114" height="66" rx="4" fill="#253545"/>
                <rect x="398" y="8"   width="74"  height="66" rx="4" fill="#2b3e52"/>

                <rect x="8"   y="96"  width="106" height="58" rx="4" fill="#2b3e52"/>
                <rect x="130" y="96"  width="124" height="58" rx="4" fill="#253545"/>
                <rect x="270" y="96"  width="114" height="58" rx="4" fill="#2b3e52"/>
                <rect x="398" y="96"  width="74"  height="58" rx="4" fill="#253545"/>

                <rect x="8"   y="176" width="106" height="58" rx="4" fill="#253545"/>
                <rect x="130" y="176" width="124" height="58" rx="4" fill="#1e3d2a"/>
                <rect x="140" y="184" width="104" height="42" rx="3" fill="#245032"/>
                <rect x="270" y="176" width="114" height="58" rx="4" fill="#253545"/>
                <rect x="398" y="176" width="74"  height="58" rx="4" fill="#2b3e52"/>

                <rect x="8"   y="256" width="466" height="36" rx="4" fill="#2b3e52"/>

                <line x1="0"   y1="88"  x2="480" y2="88"  stroke="#3d5a74" strokeWidth="2" strokeDasharray="16,12"/>
                <line x1="0"   y1="168" x2="480" y2="168" stroke="#3d5a74" strokeWidth="2" strokeDasharray="16,12"/>
                <line x1="125" y1="0"   x2="125" y2="300" stroke="#3d5a74" strokeWidth="2" strokeDasharray="16,12"/>
                <line x1="267" y1="0"   x2="267" y2="300" stroke="#3d5a74" strokeWidth="2" strokeDasharray="16,12"/>

                <circle cx="267" cy="160" r="28" fill="rgba(200,150,62,0.15)"/>
                <circle cx="267" cy="160" r="18" fill="rgba(200,150,62,0.2)"/>

                <path d="M267 126 C254 126 244 136 244 149 C244 164 267 180 267 180 S290 164 290 149 C290 136 280 126 267 126 Z" fill="#c8963e"/>
                <circle cx="267" cy="149" r="8" fill="white"/>

                <rect x="180" y="100" width="174" height="22" rx="11" fill="rgba(200,150,62,0.92)"/>
                <text x="267" y="115" textAnchor="middle" fontSize="10" fontFamily="Georgia, serif" fontWeight="700" fill="#0d0d0d" letterSpacing="0.5">The Golden Ladle</text>
              </svg>
            </div>

            <div className="location__map-bar">
              <div className="location__map-address">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>{contact.address}</span>
              </div>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="location__map-btn">
                Open in Maps
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M7 17L17 7M17 7H7M17 7v10"/>
                </svg>
              </a>
            </div>
          </div>

          {/* INFO PANEL */}
          <div
            ref={infoRef}
            className={`location__info g-reveal g-reveal--delay-2 ${infoInView ? 'g-reveal--visible' : ''}`}
          >
            <div className="location__address-card">
              <div className="location__address-icon">📍</div>
              <div>
                <p className="location__address-label">Our Address</p>
                <p className="location__address-text">{contact.address}</p>
              </div>
            </div>

            <a
              className="location__directions-btn"
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Get Directions</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M7 17L17 7M17 7H7M17 7v10"/>
              </svg>
            </a>
          </div>

        </div>
      </div>
    </section>
  )
}