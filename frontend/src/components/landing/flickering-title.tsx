"use client"

import React, { useEffect, useRef } from 'react'
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

export function FlickeringTitle() {
  const titleRef = useRef<HTMLHeadingElement>(null)
  
  useGSAP(() => {
    if (!titleRef.current) return
    
    // Create a flickering animation
    const flicker = () => {
      // Random flicker intensity
      const intensity = Math.random() * 0.4
      
      // Random duration between 0.05 and 0.2 seconds
      const duration = 0.05 + Math.random() * 0.15
      
      // Random delay before next flicker
      const delay = 0.1 + Math.random() * 2
      
      // Animate brightness and text shadow
      gsap.to(titleRef.current, {
        filter: `brightness(${1 - intensity})`,
        textShadow: `0 0 ${5 - intensity * 4}px currentColor`,
        duration: duration,
        onComplete: () => {
          // Restore normal brightness
          gsap.to(titleRef.current, {
            filter: 'brightness(1)',
            textShadow: '0 0 5px currentColor',
            duration: duration,
            delay: delay * 0.2,
            onComplete: flicker
          })
        }
      })
    }
    
    // Start the flickering effect
    flicker()
    
    // Occasional glitch effect
    const glitchInterval = setInterval(() => {
      if (Math.random() < 0.3) return // Only glitch sometimes
      
      const glitchDuration = 0.1 + Math.random() * 0.1
      
      gsap.to(titleRef.current, {
        skewX: Math.random() * 10 - 5,
        letterSpacing: `${Math.random() * 2 - 1}px`,
        filter: 'brightness(1.5) contrast(1.5)',
        duration: glitchDuration / 2,
        onComplete: () => {
          gsap.to(titleRef.current, {
            skewX: 0,
            letterSpacing: 'normal',
            filter: 'brightness(1) contrast(1)',
            duration: glitchDuration / 2
          })
        }
      })
    }, 5000) // Try to glitch every 5 seconds
    
    return () => {
      clearInterval(glitchInterval)
    }
  }, [])
  
  return (
    <h1 
      ref={titleRef}
      className="font-arcade text-5xl md:text-7xl leading-tight whitespace-nowrap tracking-wider glow-heading"
    >
      <span className="neon-text-cyan">Phish</span>
      <span className="neon-text-magenta mx-4">N</span>
      <span className="neon-text-green">Click</span>
    </h1>
  )
}
