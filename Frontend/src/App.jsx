import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { useRestaurantData } from './hooks/useRestaurantData.js'
import Home from './pages/Home/Home.jsx'
import Loader from './components/Loader/Loader.jsx'

export default function App() {
  const { data, loading, error } = useRestaurantData()

  if (loading) return <Loader />
  if (error) return (
    <div className="app-error">
      <p>Failed to load restaurant data. Please check <code>public/data.json</code>.</p>
    </div>
  )

  return (
    <Routes>
      <Route path="/" element={<Home data={data} />} />
      {/* Add future pages here */}
    </Routes>
  )
}