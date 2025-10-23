"use client"

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, MousePointerClick, Loader2, Radio, Bomb } from 'lucide-react'
import { PopupBehavior, updateBouncingPopup, updateAvoidingPopup, updatePulsingPopup, updateSpinningPopup } from './game-mechanics'

interface AnimatedPopupProps {
  children: React.ReactNode
  behavior: PopupBehavior
  initialX: number
  initialY: number
  width: number
  height: number
  cursorPosition: { x: number; y: number }
  isPaused?: boolean
  isFrozen?: boolean
  isSlowMo?: boolean
  onPositionUpdate?: (x: number, y: number) => void
  onBehaviorUpdate?: (behavior: PopupBehavior) => void
}

export function InfectedGIF({ x, y, url, size, onClick }: { x: number; y: number; url: string; size: number; onClick: () => void }) {
  return (
    <motion.img
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      src={url}
      alt="infected gif"
      className="absolute cursor-pointer shadow-lg pointer-events-auto"
      style={{ left: x, top: y, width: size * 5, height: size * 5, objectFit: 'contain', zIndex: 140, background: 'transparent' }}
      onClick={onClick}
    />
  )
}

export function AnimatedPopup({
  children,
  behavior,
  initialX,
  initialY,
  width,
  height,
  cursorPosition,
  isPaused = false,
  isFrozen = false,
  isSlowMo = false,
  onPositionUpdate,
  onBehaviorUpdate,
}: AnimatedPopupProps) {
  const [position, setPosition] = useState({ x: initialX, y: initialY })
  const [currentBehavior, setCurrentBehavior] = useState(behavior)
  const animationFrameRef = useRef<number>()
  const lastUpdateRef = useRef<number>(Date.now())

  useEffect(() => {
    if (isPaused || isFrozen || behavior.type === 'static') {
      return
    }

    const animate = () => {
      const now = Date.now()
      const deltaTime = now - lastUpdateRef.current
      lastUpdateRef.current = now

      // Apply slow-mo effect
      const speedMultiplier = isSlowMo ? 0.3 : 1.0

      let newX = position.x
      let newY = position.y
      let newBehavior = currentBehavior

      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight

      switch (behavior.type) {
        case 'bounce': {
          const result = updateBouncingPopup(
            { ...currentBehavior, speed: currentBehavior.speed * speedMultiplier },
            position.x,
            position.y,
            width,
            height,
            screenWidth,
            screenHeight
          )
          newX = result.x
          newY = result.y
          newBehavior = result.behavior
          break
        }

        case 'avoid-cursor': {
          const result = updateAvoidingPopup(
            { ...currentBehavior, speed: currentBehavior.speed * speedMultiplier },
            position.x,
            position.y,
            width,
            height,
            cursorPosition.x,
            cursorPosition.y,
            screenWidth,
            screenHeight
          )
          newX = result.x
          newY = result.y
          break
        }

        case 'pulse': {
          newBehavior = updatePulsingPopup(currentBehavior)
          break
        }

        case 'spin': {
          newBehavior = updateSpinningPopup(currentBehavior)
          break
        }
      }

      if (newX !== position.x || newY !== position.y) {
        setPosition({ x: newX, y: newY })
        onPositionUpdate?.(newX, newY)
      }

      if (newBehavior !== currentBehavior) {
        setCurrentBehavior(newBehavior)
        onBehaviorUpdate?.(newBehavior)
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [behavior.type, isPaused, isFrozen, isSlowMo, cursorPosition])

  // Trap popup with special styling
  if (behavior.isTrap) {
    return (
      <motion.div
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: width,
          height: height,
          zIndex: 150,
          transform: `scale(${currentBehavior.scale}) rotate(${currentBehavior.rotation}deg)`,
          transformOrigin: 'center center',
        }}
        className="pointer-events-auto cursor-pointer"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ 
          opacity: 1, 
          scale: currentBehavior.scale,
          rotate: currentBehavior.rotation,
        }}
      >
        <div className="relative w-full h-full">
          {children}
          {/* Trap indicator - subtle glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-red-500/10 animate-pulse rounded-lg" />
          </div>
        </div>
      </motion.div>
    )
  }

  // Static popup
  if (behavior.type === 'static') {
    return (
      <motion.div
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: width,
          height: height,
          zIndex: 150,
        }}
        className="pointer-events-auto"
        initial={{ opacity: 0, scale: 0.8, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8 }}
      >
        {children}
      </motion.div>
    )
  }

  // Animated popups
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: width,
        height: height,
        zIndex: 150,
        transform: `scale(${currentBehavior.scale}) rotate(${currentBehavior.rotation}deg)`,
        transformOrigin: 'center center',
      }}
      className="pointer-events-auto"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ 
        opacity: 1,
        scale: currentBehavior.scale,
        rotate: currentBehavior.rotation,
      }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: 'spring', damping: 20 }}
    >
      {children}
      
      {/* Visual indicators for behavior type */}
      {behavior.type === 'bounce' && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-arcade-cyan rounded-full flex items-center justify-center">
          <Zap className="w-3 h-3 text-white" />
        </div>
      )}
      {behavior.type === 'avoid-cursor' && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-arcade-magenta rounded-full flex items-center justify-center">
          <MousePointerClick className="w-3 h-3 text-white" />
        </div>
      )}
      {behavior.type === 'spin' && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-arcade-yellow rounded-full flex items-center justify-center animate-spin">
          <Loader2 className="w-3 h-3 text-white" />
        </div>
      )}
      {behavior.type === 'pulse' && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
          <Radio className="w-3 h-3 text-white" />
        </div>
      )}
    </motion.div>
  )
}

// Trap GIF Component that appears as a clickable element
export function TrapGIF({ 
  x, 
  y, 
  onClick 
}: { 
  x: number
  y: number
  onClick: () => void 
}) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0, rotate: -180 }}
      animate={{ 
        opacity: 1, 
        scale: [1, 1.1, 1],
        rotate: [0, 5, -5, 0]
      }}
      transition={{
        scale: { repeat: Infinity, duration: 0.8 },
        rotate: { repeat: Infinity, duration: 0.5 }
      }}
      exit={{ opacity: 0, scale: 0 }}
      whileHover={{ scale: 1.2 }}
      className="absolute w-32 h-32 cursor-pointer"
      style={{ left: x, top: y }}
      onClick={onClick}
    >
      {/* Danger pulsing ring */}
      <motion.div 
        className="absolute inset-0 rounded-full border-4 border-red-600"
        animate={{ 
          scale: [1, 1.4, 1],
          opacity: [0.8, 0, 0.8]
        }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      />
      
      {/* Main bomb container */}
      <div className="relative w-full h-full bg-gradient-to-br from-red-600 via-red-500 to-orange-600 rounded-xl flex items-center justify-center border-4 border-yellow-400 shadow-2xl">
        {/* Animated stripes for danger look */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-transparent rounded-xl" />
        
        {/* Large bomb icon */}
        <Bomb className="w-16 h-16 text-yellow-400 drop-shadow-lg relative z-10" strokeWidth={2.5} />
        
        {/* Warning text */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-black px-2 py-0.5 rounded text-yellow-400 text-xs font-bold border border-yellow-400">
          DANGER!
        </div>
      </div>
      
      {/* Glowing effect */}
      <div className="absolute inset-0 bg-red-600/40 blur-2xl rounded-xl" />
      
      {/* Sparks effect */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
      >
        <div className="absolute top-0 left-1/2 w-2 h-2 bg-yellow-400 rounded-full" />
        <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-orange-400 rounded-full" />
      </motion.div>
    </motion.button>
  )
}

// Infection Overlay Animation
export function InfectionOverlay({ onComplete }: { onComplete?: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.()
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] pointer-events-none"
    >
      {/* Red flash */}
      <motion.div
        animate={{
          opacity: [0, 0.8, 0, 0.8, 0, 0.6, 0],
        }}
        transition={{ duration: 2, times: [0, 0.1, 0.2, 0.3, 0.4, 0.6, 1] }}
        className="absolute inset-0 bg-red-600"
      />
      
      {/* Static noise effect */}
      <motion.div
        animate={{
          opacity: [0, 0.3, 0, 0.3, 0],
        }}
        transition={{ duration: 1.5, repeat: 2 }}
        className="absolute inset-0"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
          backgroundSize: '128px 128px',
        }}
      />

      {/* Warning text */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="bg-red-600 border-4 border-white text-white px-12 py-8 rounded-lg shadow-2xl">
          <div className="font-arcade text-4xl text-center mb-4">⚠️ INFECTED! ⚠️</div>
          <div className="font-terminal text-xl text-center">You clicked malicious content!</div>
          <div className="font-terminal text-sm text-center mt-2 opacity-80">-1 Life</div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Freeze Effect Overlay
export function FreezeEffect() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.3 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] pointer-events-none bg-blue-400/20 backdrop-blur-[2px]"
    >
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
      }} />
    </motion.div>
  )
}

// Slow Motion Effect Overlay
export function SlowMotionEffect() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.2 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] pointer-events-none bg-purple-600/20 backdrop-blur-[1px]"
    />
  )
}
