import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Restaurants from './pages/Restaurants';
import RestaurantDetails from './pages/RestaurantDetails';
import Settings from './pages/Settings';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import { DialogProvider } from './context/DialogContext';
import { TitleProvider } from './context/TitleContext';

export default function App() {
  return (
    <TitleProvider>
      <DialogProvider>
        <BrowserRouter>
          <Routes>
            {/* Open route */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes (internal checks in Layout component) */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/restaurants" element={<Restaurants />} />
            <Route path="/restaurants/:restaurantId" element={<RestaurantDetails />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </DialogProvider>
    </TitleProvider>
  );
}
