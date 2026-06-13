import React from 'react';
import './Skeleton.css';

/**
 * Animated shimmer skeleton loader.
 * @param {'line' | 'title' | 'circle' | 'card' | 'button'} type - preset shape
 * @param {string | number} width - custom width
 * @param {string | number} height - custom height
 * @param {string} className - extra class
 * @param {number} count - number of duplicates to render
 */
export default function Skeleton({
  type = 'line',
  width,
  height,
  className = '',
  count = 1,
  style = {},
}) {
  const elements = Array.from({ length: count });

  const combinedStyle = {
    ...(width && { width }),
    ...(height && { height }),
    ...style,
  };

  const skeletonClass = `skeleton skeleton--${type} ${className}`;

  if (count > 1) {
    return (
      <>
        {elements.map((_, idx) => (
          <div
            key={idx}
            className={skeletonClass}
            style={combinedStyle}
            aria-hidden="true"
          />
        ))}
      </>
    );
  }

  return (
    <div
      className={skeletonClass}
      style={combinedStyle}
      aria-hidden="true"
    />
  );
}
