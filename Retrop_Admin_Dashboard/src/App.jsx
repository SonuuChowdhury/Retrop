import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Restaurants from './pages/Restaurants';
import RestaurantDetails from './pages/RestaurantDetails';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Open route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes (internal checks in Layout component) */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/restaurants/:restaurantId" element={<RestaurantDetails />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
