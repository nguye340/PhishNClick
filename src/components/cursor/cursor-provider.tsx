"use client"

import React, { useEffect, useState, useCallback } from "react"

export function CursorProvider({ children }: { children: React.ReactNode }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [trailPositions, setTrailPositions] = useState<{ x: number, y: number, time: number }[]>([])
  const maxTrails = 5
  const trailDelay = 50 // ms between trail updates

  const updateMousePosition = useCallback((e: MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY })
    
    setTrailPositions(prev => {
      const now = Date.now()
      const newPos = { x: e.clientX, y: e.clientY, time: now }
      return [newPos, ...prev.slice(0, maxTrails - 1)]
    })
  }, [])

  useEffect(() => {
    let lastUpdate = 0
    const smoothMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      if (now - lastUpdate >= trailDelay) {
        updateMousePosition(e)
        lastUpdate = now
      }
    }

    window.addEventListener('mousemove', smoothMouseMove)
    return () => window.removeEventListener('mousemove', smoothMouseMove)
  }, [updateMousePosition])

  return (
    <>
      <div 
        className="custom-cursor"
        style={{ 
          left: `${mousePosition.x}px`, 
          top: `${mousePosition.y}px`,
          transform: `translate(-50%, -50%)`
        }}
      />
      {trailPositions.map((pos, i) => (
        <div
          key={i}
          className="cursor-trail"
          style={{
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            opacity: 1 - (i / maxTrails),
            transform: `translate(-50%, -50%) scale(${1 - (i / maxTrails)})`,
          }}
        />
      ))}
      {children}
    </>
  )
}
