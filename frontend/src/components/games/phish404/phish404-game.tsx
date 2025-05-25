"use client"

import React from "react"

export default function Phish404Game() {
  return (
    <div className="w-full h-screen bg-black flex flex-col items-center justify-center p-0 overflow-hidden">
      <iframe
        src="/games/phish404/index.html"
        style={{
          width: '100vw',
          height: '100vh',
          border: 'none',
          margin: 0,
          padding: 0,
          overflow: 'hidden',
          backgroundColor: 'black'
        }}
        title="Phish404 Game"
        allowFullScreen
        scrolling="no"
        frameBorder="0"
      />
    </div>
  )
}
