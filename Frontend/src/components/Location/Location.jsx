import React from 'react'
import { useInView } from '../../hooks/useInView.js'
import './Location.css'

export default function Location({ location, contact }) {
  const { ref, inView } = useInView()

  return (
    <section className="location g-section" id="location" aria-label="Location and map">
      <div className="g-container">
        <header
          ref={ref}
          className={`location__header g-reveal ${inView ? 'g-reveal--visible' : ''}`}
        >
          <span className="g-section-label">Find Us</span>
          <h2 className="location__heading">
            Come Visit<br /><em>Our Home</em>
          </h2>
        </header>

        <div className="location__body">
          {/* Map embed */}
          <div className="location__map-wrap g-reveal g-reveal--delay-1">
            <iframe
              className="location__map"
              src={location.googleMapsEmbedUrl}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Restaurant location on Google Maps"
            />
          </div>

          {/* Address + directions */}
          <div className="location__info g-reveal g-reveal--delay-2">
            <div className="location__address-card">
              <div className="location__address-icon" aria-hidden="true">📍</div>
              <div>
                <p className="location__address-label">Our Address</p>
                <p className="location__address-text">{contact.address}</p>
              </div>
            </div>

            <a
              className="location__directions-btn"
              href={location.googleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Get directions on Google Maps"
            >
              <span>Get Directions</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}