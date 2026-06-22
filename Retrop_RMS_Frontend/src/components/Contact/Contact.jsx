import React from 'react'
import { useInView } from '../../hooks/useInView.js'
import './Contact.css'

function ContactItem({ icon, label, value, href }) {
  const content = (
    <div className="contact-item">
      <span className="contact-item__icon" aria-hidden="true">{icon}</span>
      <div className="contact-item__text">
        <span className="contact-item__label">{label}</span>
        <span className="contact-item__value">{value}</span>
      </div>
    </div>
  )

  if (href) {
    return (
      <a className="contact-item__link" href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
        {content}
      </a>
    )
  }

  return content
}

export default function Contact({ contact, reviews }) {
  const { ref, inView } = useInView()

  return (
    <section className="contact g-section--tight" id="contact" aria-label="Contact information">
      <div className="g-container">
        <div
          ref={ref}
          className={`contact__inner g-reveal ${inView ? 'g-reveal--visible' : ''}`}
        >
          <div className="contact__left">
            <span className="g-section-label">Contact Us</span>
            <h2 className="contact__heading">
              Let's Get<br /><em>In Touch</em>
            </h2>
            <p className="contact__subtext">
              For reservations, private dining, or any queries — we're here for you.
            </p>
          </div>

          <div className="contact__right">
            <div className="contact__cards">
              <ContactItem
                icon="📞"
                label="Phone"
                value={contact.phone}
                href={`tel:${contact.phone?.replace(/\s/g, '')}`}
              />
              {contact.whatsapp && (
                <ContactItem
                  icon="💬"
                  label="WhatsApp"
                  value="Chat with us"
                  href={`https://wa.me/${contact.whatsapp}`}
                />
              )}
              <ContactItem
                icon="✉️"
                label="Email"
                value={contact.email}
                href={`mailto:${contact.email}`}
              />
              <ContactItem
                icon="📍"
                label="Address"
                value={contact.address}
              />
            </div>

            {/* Social links */}
            {(contact.socialLinks?.instagram || contact.socialLinks?.facebook) && (
              <div className="contact__social">
                {contact.socialLinks.instagram && (
                  <a
                    className="contact__social-link"
                    href={contact.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Follow us on Instagram"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                    </svg>
                    Instagram
                  </a>
                )}
                {contact.socialLinks.facebook && (
                  <a
                    className="contact__social-link"
                    href={contact.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Follow us on Facebook"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                    Facebook
                  </a>
                )}
              </div>
            )}

            {/* Google Review link */}
            {reviews?.googleReviewUrl && (
              <a
                className="contact__review-btn"
                href={reviews.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Leave a review on Google"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Leave a Google Review
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}