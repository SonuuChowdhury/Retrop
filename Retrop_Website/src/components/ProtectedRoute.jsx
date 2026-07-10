// ============================================================================
// ROUTING GUARD COMPONENT
// ============================================================================

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { owner, loading } = useAuth();

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <p style={{ fontSize: '14px', fontWeight: '500' }}>Checking session...</p>
      </div>
    );
  }

  if (!owner) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
