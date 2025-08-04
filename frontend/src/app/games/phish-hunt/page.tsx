"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PhishHuntPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the static HTML game
    window.location.href = '/games/phish-hunt/html/index.html'
  }, [])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-white text-2xl mb-4">Loading Phish Hunt...</h1>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
        <p className="text-gray-400 mt-4">
          If the game doesn't load automatically, 
          <a href="/games/phish-hunt/html/index.html" className="text-blue-400 hover:underline ml-1">
            click here
          </a>
        </p>
      </div>
    </div>
  )
}
