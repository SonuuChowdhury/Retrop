import React from 'react'
import { useInView } from '../../hooks/useInView.js'
import './OrderOnline.css'

export default function OrderOnline({ orderOnline }) {
  const { ref, inView } = useInView()
  const { isSwiggyActive, swiggyUrl, isZomatoActive, zomatoUrl } = orderOnline

  const hasAnyActive = isSwiggyActive || isZomatoActive
  if (!hasAnyActive) return null

  return (
    <section className="order-online g-section--tight" id="order" aria-label="Order online">
      <div className="g-container">
        <div
          ref={ref}
          className={`order-online__inner g-reveal ${inView ? 'g-reveal--visible' : ''}`}
        >
          <div className="order-online__text">
            <span className="g-section-label">Order Online</span>
            <h2 className="order-online__heading">
              Dine at Home,<br /><em>Restaurant Quality</em>
            </h2>
            <p className="order-online__subtext">
              Our kitchen delivers — same care, same flavour, right to your door.
            </p>
          </div>

          <div className="order-online__platforms">
            {isSwiggyActive && swiggyUrl && (
              <a
                className="order-platform order-platform--swiggy"
                href={swiggyUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Order on Swiggy"
              >
                <div className="order-platform__logo order-platform__logo--swiggy" aria-hidden="true">
                  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
                    <circle cx="32" cy="32" r="32" fill="#FF5200"/>
                    <path d="M20 26c0-6.627 5.373-12 12-12s12 5.373 12 12c0 4.5-2.5 8.5-6 10.5L32 50l-6-13.5C22.5 34.5 20 30.5 20 26z" fill="white"/>
                  </svg>
                </div>
                <div className="order-platform__info">
                  <span className="order-platform__action">Order on</span>
                  <span className="order-platform__name">Swiggy</span>
                </div>
                <svg className="order-platform__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </a>
            )}

            {isZomatoActive && zomatoUrl && (
              <a
                className="order-platform order-platform--zomato"
                href={zomatoUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Order on Zomato"
              >
                <div className="order-platform__logo order-platform__logo--zomato" aria-hidden="true">
                  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
                    <circle cx="32" cy="32" r="32" fill="#E23744"/>
                    <path d="M16 22h32l-16 20L16 22z" fill="white"/>
                  </svg>
                </div>
                <div className="order-platform__info">
                  <span className="order-platform__action">Order on</span>
                  <span className="order-platform__name">Zomato</span>
                </div>
                <svg className="order-platform__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}