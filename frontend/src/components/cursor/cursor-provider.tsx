"use client"

import React, { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

// Create a singleton to track cursor instances and prevent duplicates
let cursorInstanceCount = 0;

export function CursorProvider({ children }: { children: React.ReactNode }) {
  // Track the current pathname for navigation changes
  const pathname = usePathname()
  
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
  const instanceIdRef = useRef<number>(0)
  
  // Initialize and clean up cursor on mount/unmount and pathname changes
  useEffect(() => {
    // Clean up previous animation frame if it exists
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    
    // Reset initialization flag on pathname change
    isInitializedRef.current = false;
    
    // Ensure we only have one cursor instance active
    if (instanceIdRef.current === 0) {
      // Assign a new instance ID
      cursorInstanceCount++;
      instanceIdRef.current = cursorInstanceCount;
    }
    
    return () => {
      // Clean up on unmount or route change
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [pathname]); // Re-initialize when pathname changes

  useEffect(() => {
    // Skip if already initialized for this instance
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    // Initialize positions
    positionsRef.current = Array(maxTrails).fill({ x: 0, y: 0 });
    
    // Track mouse movement state
    let isMoving = false;
    let lastFrameTime = 0;
    const frameThrottle = 1000 / 60; // 60fps cap
    
    // Direct DOM manipulation for better performance
    const updateCursorPosition = (timestamp: number) => {
      // Throttle updates for better performance
      if (timestamp - lastFrameTime < frameThrottle) {
        return;
      }
      lastFrameTime = timestamp;
      
      const { x, y } = lastPositionRef.current;
      if (!cursorRef.current) return;
      
      // Use translate3d for hardware acceleration
      cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      
      // Update trail positions with a slight delay effect
      positionsRef.current.unshift({ x, y });
      positionsRef.current = positionsRef.current.slice(0, maxTrails);
      
      // Update trail elements with optimized style changes
      trailRefs.current.forEach((trail, i) => {
        if (!trail) return;
        
        const pos = positionsRef.current[i] || positionsRef.current[positionsRef.current.length - 1];
        const opacity = 1 - (i / maxTrails);
        const scale = 1 - (i / maxTrails) * 0.5;
        
        // Batch style updates for better performance
        trail.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${scale})`;
        trail.style.opacity = opacity.toString();
      });
    };
    
    // Throttled mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      lastPositionRef.current = { x: e.clientX, y: e.clientY };
      isMoving = true;
      
      // Only start animation loop when mouse is moving
      if (!rafRef.current) {
        animateCursor(performance.now());
      }
    };
    
    // Use requestAnimationFrame for smoother animation
    const animateCursor = (timestamp: number) => {
      if (isMoving) {
        updateCursorPosition(timestamp);
        isMoving = false;
      }
      rafRef.current = requestAnimationFrame(animateCursor);
    };
    
    // Use passive event listener for better performance
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    return () => {
      // Clean up event listener
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [maxTrails, pathname]); // Re-initialize when pathname or maxTrails changes

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
