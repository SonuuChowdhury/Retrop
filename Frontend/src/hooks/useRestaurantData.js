import { useState, useEffect } from 'react'

export function useRestaurantData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/data.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch data.json')
        return res.json()
      })
      .then((json) => {
        setData(json)
        setLoading(false)

        // Apply accent color from branding
        if (json?.branding?.accentColor) {
          document.documentElement.style.setProperty(
            '--color-accent',
            json.branding.accentColor
          )
        }
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return { data, loading, error }
}