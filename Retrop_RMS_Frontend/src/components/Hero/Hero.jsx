import React, { useState, useEffect, useCallback } from 'react'
import './Hero.css'

export default function Hero({ branding, reviews }) {
  const { heroImages = [], heroSlideIntervalMs = 4000, name, tagline, shortDescription, logoUrl } = branding
  const [activeIndex, setActiveIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)

  const advance = useCallback(() => {
    setActiveIndex((i) => (i + 1) % heroImages.length)
  }, [heroImages.length])

  useEffect(() => {
    if (heroImages.length <= 1) return
    const timer = setInterval(advance, heroSlideIntervalMs)
    return () => clearInterval(timer)
  }, [advance, heroImages.length, heroSlideIntervalMs])

  useEffect(() => {
    // Trigger entrance animation after mount
    const t = setTimeout(() => setLoaded(true), 80)
    return () => clearTimeout(t)
  }, [])

  const stars = reviews?.averageRating ? Math.round(reviews.averageRating) : 5

  return (
    <section className="hero" aria-label="Restaurant hero">
      {/* Slideshow */}
      <div className="hero__slides" aria-hidden="true">
        {heroImages.map((src, i) => (
          <div
            key={src}
            className={`hero__slide ${i === activeIndex ? 'hero__slide--active' : ''}`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
        <div className="hero__overlay" />
        <div className="hero__grain" />
      </div>

      {/* Content */}
      <div className={`hero__content g-container ${loaded ? 'hero__content--loaded' : ''}`}>
        {logoUrl && (
          <div className="hero__logo-wrap">
            <img className="hero__logo" src={logoUrl} alt={`${name} logo`} />
          </div>
        )}

        <div className="hero__badge">
          <span className="hero__stars" aria-label={`${reviews?.averageRating} stars`}>
            {'★'.repeat(stars)}
          </span>
          {reviews?.averageRating && (
            <span className="hero__rating-text">
              {reviews.averageRating} · {reviews.totalReviews?.toLocaleString()} reviews
            </span>
          )}
        </div>

        <h1 className="hero__title">{name}</h1>
        <p className="hero__tagline">{tagline}</p>
        <p className="hero__description">{shortDescription}</p>

        <div className="hero__actions">
          <button
            className="hero__btn hero__btn--primary"
            onClick={() => document.querySelector('#dishes')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Explore Menu
          </button>
          <button
            className="hero__btn hero__btn--ghost"
            onClick={() => document.querySelector('#location')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Find Us
          </button>
        </div>
      </div>

      {/* Slide indicators */}
      {heroImages.length > 1 && (
        <div className="hero__dots" aria-label="Slide indicators">
          {heroImages.map((_, i) => (
            <button
              key={i}
              className={`hero__dot ${i === activeIndex ? 'hero__dot--active' : ''}`}
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Scroll cue */}
      <div className="hero__scroll-cue" aria-hidden="true">
        <span></span>
      </div>
    </section>
  )
}