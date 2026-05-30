import React, { useState } from 'react'
import { useInView } from '../../hooks/useInView.js'
import './SignatureDishes.css'

function DishCard({ dish, index }) {
  const { ref, inView } = useInView()
  const [imgError, setImgError] = useState(false)

  return (
    <article
      ref={ref}
      className={`dish-card g-reveal g-reveal--delay-${Math.min(index + 1, 5)} ${inView ? 'g-reveal--visible' : ''}`}
      aria-label={dish.name}
    >
      <div className="dish-card__image-wrap">
        {!imgError ? (
          <img
            className="dish-card__image"
            src={dish.photoUrl}
            alt={dish.name}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="dish-card__image-fallback" aria-hidden="true">
            <span>🍽</span>
          </div>
        )}

        {/* Veg / Non-veg indicator */}
        <div
          className={`dish-card__veg-badge ${dish.isVeg ? 'dish-card__veg-badge--veg' : 'dish-card__veg-badge--nonveg'}`}
          title={dish.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
          aria-label={dish.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
        >
          <span></span>
        </div>

        {dish.tag && (
          <div className="dish-card__tag">{dish.tag}</div>
        )}
      </div>

      <div className="dish-card__body">
        <h3 className="dish-card__name">{dish.name}</h3>
        <p className="dish-card__description">{dish.description}</p>
        {dish.allergens && dish.allergens.length > 0 && (
          <p className="dish-card__allergens">
            Contains: {dish.allergens.join(', ')}
          </p>
        )}
      </div>
    </article>
  )
}

export default function SignatureDishes({ dishes }) {
  const { ref, inView } = useInView()

  if (!dishes || dishes.length === 0) return null

  return (
    <section className="signature-dishes g-section" id="dishes" aria-label="Signature dishes">
      <div className="g-container">
        <header
          ref={ref}
          className={`signature-dishes__header g-reveal ${inView ? 'g-reveal--visible' : ''}`}
        >
          <span className="g-section-label">Signature Dishes</span>
          <h2 className="signature-dishes__heading">
            Crafted with<br />
            <em>Passion & Tradition</em>
          </h2>
          <p className="signature-dishes__subtext">
            Every dish on this menu is a story — of sourcing, seasoning, and the soul of our kitchen.
          </p>
        </header>

        <div className="signature-dishes__grid">
          {dishes.map((dish, i) => (
            <DishCard key={dish.id} dish={dish} index={i % 5} />
          ))}
        </div>
      </div>
    </section>
  )
}