"use client"

import React, { useEffect, useRef, useState } from "react"

export function CursorProvider({ children }: { children: React.ReactNode }) {
  // Using refs for direct DOM manipulation (better performance)
  const cursorRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const maxTrails = 3 // Reduced for better performance
  
  // Use state for initial rendering of trail elements
  const [trailElements] = useState(() => Array(maxTrails).fill(0))
  
  // Refs for tracking positions and elements
  const trailRefs = useRef<(HTMLDivElement | null)[]>([])
  const positionsRef = useRef<{ x: number, y: number }[]>([])
  
  // Performance optimization flags
  const isInitializedRef = useRef(false)
  const lastPositionRef = useRef({ x: 0, y: 0 })
  
  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    // Skip if already initialized
    if (isInitializedRef.current) return
    isInitializedRef.current = true
    
    // Initialize positions
    positionsRef.current = Array(maxTrails).fill({ x: 0, y: 0 })
    
    let isMoving = false
    
    // Direct DOM manipulation for better performance
    const updateCursorPosition = () => {
      const { x, y } = lastPositionRef.current
      if (!cursorRef.current) return
      
      // Use translate3d for hardware acceleration
      cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      
      // Update trail positions with a slight delay effect
      positionsRef.current.unshift({ x, y })
      positionsRef.current = positionsRef.current.slice(0, maxTrails)
      
      // Update trail elements with optimized style changes
      trailRefs.current.forEach((trail, i) => {
        if (!trail) return
        
        const pos = positionsRef.current[i] || positionsRef.current[positionsRef.current.length - 1]
        const opacity = 1 - (i / maxTrails)
        const scale = 1 - (i / maxTrails) * 0.5
        
        // Batch style updates for better performance
        trail.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${scale})`
        trail.style.opacity = opacity.toString()
      })
    }
    
    // Throttled mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      lastPositionRef.current = { x: e.clientX, y: e.clientY }
      isMoving = true
      
      // Only start animation loop when mouse is moving
      if (!rafRef.current) {
        animateCursor()
      }
    }
    
    // Use requestAnimationFrame for smoother animation
    const animateCursor = () => {
      if (isMoving) {
        updateCursorPosition()
        isMoving = false
      }
      rafRef.current = requestAnimationFrame(animateCursor)
    }
    
    // Use passive event listener for better performance
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [maxTrails])

  return (
    <>
      <div 
        ref={cursorRef}
        className="custom-cursor"
        style={{ 
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 9999,
          willChange: 'transform', // Optimize for animations
          top: 0,
          left: 0
        }}
      />
      {trailElements.map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            // Store reference to the trail element
            trailRefs.current[i] = el;
          }}
          className="cursor-trail"
          style={{
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: 9998 - i,
            willChange: 'transform', // Optimize for animations
            top: 0,
            left: 0,
            opacity: 0
          }}
        />
      ))}
      {children}
    </>
  )
}
