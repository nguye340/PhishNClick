"use client"

import React, { useEffect, useRef } from 'react'
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

interface FireworksProps {
  isActive: boolean
  duration?: number
  onComplete?: () => void
}

export function Fireworks({ isActive, duration = 3, onComplete }: FireworksProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<HTMLDivElement[]>([])
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useGSAP(() => {
    if (!isActive || !containerRef.current) return

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Create fireworks
    const createFirework = (x: number, y: number, color: string) => {
      const particles = []
      const particleCount = 30 + Math.floor(Math.random() * 20)
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div')
        particle.className = 'absolute rounded-full'
        particle.style.width = `${3 + Math.random() * 3}px`
        particle.style.height = `${3 + Math.random() * 3}px`
        particle.style.backgroundColor = color
        particle.style.boxShadow = `0 0 ${6 + Math.random() * 8}px ${color}`
        particle.style.left = `${x}px`
        particle.style.top = `${y}px`
        particle.style.opacity = '1'
        
        containerRef.current?.appendChild(particle)
        particles.push(particle)
        
        const angle = Math.random() * Math.PI * 2
        const speed = 1 + Math.random() * 5
        const distance = 50 + Math.random() * 150
        
        gsap.to(particle, {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          opacity: 0,
          duration: 0.8 + Math.random() * 0.6,
          ease: "power2.out",
          onComplete: () => {
            if (containerRef.current?.contains(particle)) {
              containerRef.current?.removeChild(particle)
            }
          }
        })
      }
    }

    // Launch multiple fireworks at random positions
    const launchFireworks = () => {
      if (!containerRef.current) return
      
      const colors = [
        '#FF5722', // Orange
        '#E91E63', // Pink
        '#9C27B0', // Purple
        '#3F51B5', // Indigo
        '#2196F3', // Blue
        '#00BCD4', // Cyan
        '#4CAF50', // Green
        '#CDDC39', // Lime
        '#FFEB3B', // Yellow
        '#FF9800', // Deep Orange
      ]
      
      const rect = containerRef.current.getBoundingClientRect()
      const width = rect.width
      const height = rect.height
      
      // Launch 10 fireworks over 2 seconds
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          const x = 100 + Math.random() * (width - 200)
          const y = 100 + Math.random() * (height - 200)
          const color = colors[Math.floor(Math.random() * colors.length)]
          createFirework(x, y, color)
        }, i * 200)
      }
    }

    // Start the fireworks
    launchFireworks()
    
    // Set an interval to continue launching fireworks
    const interval = setInterval(launchFireworks, 800)
    
    // Set a timeout to stop the fireworks after the specified duration
    timeoutRef.current = setTimeout(() => {
      clearInterval(interval)
      if (onComplete) {
        onComplete()
      }
    }, duration * 1000)
    
    return () => {
      clearInterval(interval)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isActive, duration, onComplete])

  if (!isActive) return null

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 pointer-events-none z-40"
    />
  )
}
