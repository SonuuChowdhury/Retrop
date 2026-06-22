import React from 'react'
import { useInView } from '../../hooks/useInView.js'
import { getCurrentStatus } from '../../utils/hoursUtils.js'
import './Hours.css'

export default function Hours({ hours }) {
  const { ref, inView } = useInView()
  const { isOpen, todayEntry, nextOpen } = getCurrentStatus(hours?.schedule)

  return (
    <section className="hours g-section--tight" id="hours" aria-label="Opening hours">
      <div className="g-container">
        <div
          ref={ref}
          className={`hours__inner g-reveal ${inView ? 'g-reveal--visible' : ''}`}
        >
          <div className="hours__left">
            <span className="g-section-label">Opening Hours</span>
            <h2 className="hours__heading">When to<br /><em>Visit Us</em></h2>

            {/* Live status pill */}
            <div className={`hours__status-pill ${isOpen ? 'hours__status-pill--open' : 'hours__status-pill--closed'}`}>
              <span className="hours__status-dot"></span>
              {isOpen
                ? `Open now · Closes at ${todayEntry?.close}`
                : nextOpen
                  ? `Closed · Opens at ${nextOpen}`
                  : 'Currently Closed'}
            </div>

            {hours?.note && (
              <p className="hours__note">{hours.note}</p>
            )}
          </div>

          <div className="hours__right">
            <ul className="hours__schedule" role="list">
              {hours?.schedule?.map((entry, i) => (
                <li
                  key={i}
                  className={`hours__row ${entry.isClosed ? 'hours__row--closed' : ''}`}
                >
                  <span className="hours__days">{entry.days}</span>
                  <span className="hours__divider" aria-hidden="true"></span>
                  <span className="hours__times">
                    {entry.isClosed ? 'Closed' : `${entry.open} – ${entry.close}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}