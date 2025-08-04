"use client"

import { useEffect } from 'react'

export default function HookedOrCookedPage() {
  useEffect(() => {
    // Redirect to the static HTML game
    window.location.href = '/games/mini_game/mini_game/index.html'
  }, [])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-white text-2xl mb-4">Loading Hooked or Cooked...</h1>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
        <p className="text-gray-400 mt-4">
          If the game doesn't load automatically, 
          <a href="/games/mini_game/mini_game/index.html" className="text-blue-400 hover:underline ml-1">
            click here
          </a>
        </p>
      </div>
    </div>
  )
}
