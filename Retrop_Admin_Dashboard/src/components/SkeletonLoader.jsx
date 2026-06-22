import React from 'react';

export default function SkeletonLoader({ width, height, borderRadius = '4px', className = '', style = {} }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius,
        ...style
      }}
    />
  );
}
