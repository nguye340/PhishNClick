"use client"

import React, { useEffect, useRef, useState } from 'react'
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { AboutUsModal } from '../modals/about-us-modal'
import { Fireworks } from '../effects/fireworks'

interface Fish {
  id: number
  x: number
  y: number
  rotation: number
  scale: number
  speed: number
  color: string
  opacity: number
  targetX: number
  targetY: number
  targetRotation: number
  glowIntensity: number
  glowDirection: number
  movementPattern: 'leftRight' | 'circular' | 'random' | 'zigzag' | 'burst'
  circleCenter?: { x: number, y: number }
  circleRadius?: number
  circleAngle?: number
  burstTimer?: number
  isClicked: boolean
  clickRotation: number
  clickScale: number
  respawnTimer?: number
  isRespawning?: boolean
  isExiting?: boolean
  exitProgress?: number
}

const COLORS = [
  '#FF5722', // Orange
  '#E91E63', // Pink
  '#9C27B0', // Purple
  '#3F51B5', // Indigo
  '#2196F3', // Blue
  '#00BCD4', // Cyan
  '#009688', // Teal
  '#4CAF50', // Green
  '#CDDC39', // Lime
  '#FFEB3B', // Yellow
  '#FF9800', // Deep Orange
  '#8BC34A', // Light Green
  '#FFC107', // Amber
  '#03A9F4', // Light Blue
  '#673AB7', // Deep Purple
  '#F44336', // Red
]

export function SwimmingFish() {
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)
  const [fishes, setFishes] = useState<Fish[]>([])
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const frameRef = useRef<number>(0)
  const fishCount = 12 
  const lastUpdateRef = useRef<number>(0)
  const FPS = 60 
  const mouseAvoidDistance = 200 
  const [showFireworks, setShowFireworks] = useState(false)
  const [showAboutUsModal, setShowAboutUsModal] = useState(false)
  const [allFishClicked, setAllFishClicked] = useState(false)
  
  const isGameModesPage = pathname === '/'
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })

      const initialFishes: Fish[] = []
      for (let i = 0; i < fishCount; i++) {
        const margin = 150
        const x = margin + Math.random() * (window.innerWidth - 2 * margin)
        const y = margin + Math.random() * (window.innerHeight - 2 * margin)
        const rotation = Math.random() * 360
        
        const patternTypes: ('leftRight' | 'circular' | 'random' | 'zigzag' | 'burst')[] = [
          'leftRight', 'circular', 'random', 'zigzag', 'burst'
        ]
        const movementPattern = patternTypes[Math.floor(Math.random() * patternTypes.length)]
        
        const circleCenter = { 
          x: margin + Math.random() * (window.innerWidth - 2 * margin),
          y: margin + Math.random() * (window.innerHeight - 2 * margin)
        }
        const circleRadius = 100 + Math.random() * 150 
        const circleAngle = Math.random() * Math.PI * 2
        
        initialFishes.push({
          id: i,
          x,
          y,
          rotation,
          scale: 0.5 + Math.random() * 0.5, 
          speed: 0.8 + Math.random() * 1.2, 
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          opacity: 1,
          targetX: x,
          targetY: y,
          targetRotation: rotation,
          glowIntensity: 0.5 + Math.random() * 0.5,
          glowDirection: Math.random() < 0.5 ? 1 : -1,
          movementPattern,
          circleCenter,
          circleRadius,
          circleAngle,
          burstTimer: 0,
          isClicked: false,
          clickRotation: 0,
          clickScale: 1,
          respawnTimer: 0,
          isRespawning: false,
          isExiting: false,
          exitProgress: 0
        })
      }
      setFishes(initialFishes)
    }

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(frameRef.current)
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const handleFishClick = (id: number) => {
    setFishes(prevFishes => {
      const updatedFishes = prevFishes.map(fish => 
        fish.id === id && !fish.isClicked ? { ...fish, isClicked: true } : fish
      );
      
      // Check if all fish are clicked
      const allClicked = updatedFishes.every(fish => fish.isClicked);
      if (allClicked && !allFishClicked) {
        setAllFishClicked(true);
        setTimeout(() => {
          setShowFireworks(true);
          setTimeout(() => {
            setShowAboutUsModal(true);
          }, 2000); // Show modal after 2 seconds of fireworks
        }, 500); // Small delay before starting fireworks
      }
      
      return updatedFishes;
    });
  }

  const handleModalClose = () => {
    setShowAboutUsModal(false);
    setShowFireworks(false);
    setAllFishClicked(false);
    
    // Respawn all fish
    if (typeof window !== 'undefined') {
      const initialFishes: Fish[] = [];
      for (let i = 0; i < fishCount; i++) {
        const margin = 150;
        const x = margin + Math.random() * (window.innerWidth - 2 * margin);
        const y = margin + Math.random() * (window.innerHeight - 2 * margin);
        const rotation = Math.random() * 360;
        
        const patternTypes: ('leftRight' | 'circular' | 'random' | 'zigzag' | 'burst')[] = [
          'leftRight', 'circular', 'random', 'zigzag', 'burst'
        ];
        const movementPattern = patternTypes[Math.floor(Math.random() * patternTypes.length)];
        
        const circleCenter = { 
          x: margin + Math.random() * (window.innerWidth - 2 * margin),
          y: margin + Math.random() * (window.innerHeight - 2 * margin)
        };
        const circleRadius = 100 + Math.random() * 150;
        const circleAngle = Math.random() * Math.PI * 2;
        
        initialFishes.push({
          id: i,
          x,
          y,
          rotation,
          scale: 0.5 + Math.random() * 0.5, 
          speed: 0.8 + Math.random() * 1.2, 
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          opacity: 1,
          targetX: x,
          targetY: y,
          targetRotation: rotation,
          glowIntensity: 0.5 + Math.random() * 0.5,
          glowDirection: Math.random() < 0.5 ? 1 : -1,
          movementPattern,
          circleCenter,
          circleRadius,
          circleAngle,
          burstTimer: 0,
          isClicked: false,
          clickRotation: 0,
          clickScale: 1,
          respawnTimer: 0,
          isRespawning: false,
          isExiting: false,
          exitProgress: 0
        });
      }
      setFishes(initialFishes);
    }
  }

  useGSAP(() => {
    if (fishes.length === 0 || windowSize.width === 0 || !isGameModesPage) return

    const animate = (timestamp: number) => {
      if (timestamp - lastUpdateRef.current > 1000 / FPS) {
        lastUpdateRef.current = timestamp
        
        setFishes(prevFishes => {
          return prevFishes.map(fish => {
            if (fish.isClicked) {
              const newOpacity = fish.opacity - 0.05
              const newClickRotation = fish.clickRotation + 20 
              const newClickScale = fish.clickScale + 0.1 
              
              if (newOpacity <= 0) {
                return {
                  ...fish,
                  opacity: 0,
                  isRespawning: true,
                  respawnTimer: 0
                }
              }
              
              return {
                ...fish,
                opacity: newOpacity,
                clickRotation: newClickRotation,
                clickScale: newClickScale
              }
            }

            if (fish.isExiting) {
              const newExitProgress = (fish.exitProgress || 0) + 0.05
              const newOpacity = 1 - newExitProgress
              
              if (newExitProgress >= 1) {
                return {
                  ...fish,
                  opacity: 0,
                  isExiting: false,
                  isRespawning: true,
                  respawnTimer: 0,
                  exitProgress: 0
                }
              }
              
              return {
                ...fish,
                opacity: newOpacity,
                exitProgress: newExitProgress,
                x: fish.x + Math.cos(fish.rotation * Math.PI / 180) * fish.speed,
                y: fish.y + Math.sin(fish.rotation * Math.PI / 180) * fish.speed
              }
            }

            if (fish.isRespawning) {
              const newRespawnTimer = (fish.respawnTimer || 0) + 1
              
              if (newRespawnTimer >= 180) {
                const margin = 200
                const newX = margin + Math.random() * (windowSize.width - 2 * margin)
                const newY = margin + Math.random() * (windowSize.height - 2 * margin)
                const newRotation = Math.random() * 360
                
                return {
                  ...fish,
                  x: newX,
                  y: newY,
                  rotation: newRotation,
                  targetX: newX,
                  targetY: newY,
                  targetRotation: newRotation,
                  opacity: 1,
                  isClicked: false,
                  isRespawning: false,
                  clickRotation: 0,
                  clickScale: 1,
                  scale: 0.5 + Math.random() * 0.5,
                  glowIntensity: 0.5 + Math.random() * 0.5,
                  glowDirection: Math.random() < 0.5 ? 1 : -1,
                  burstTimer: 0,
                  respawnTimer: 0
                }
              }
              
              return {
                ...fish,
                respawnTimer: newRespawnTimer
              }
            }

            let newGlowIntensity = fish.glowIntensity + (0.02 * fish.glowDirection)
            let newGlowDirection = fish.glowDirection
            
            if (newGlowIntensity > 1) {
              newGlowIntensity = 1
              newGlowDirection = -1
            } else if (newGlowIntensity < 0.3) {
              newGlowIntensity = 0.3
              newGlowDirection = 1
            }
            
            if (Math.random() < 0.03) {
              newGlowDirection *= -1
            }

            const dx = mousePosition.x - fish.x
            const dy = mousePosition.y - fish.y
            const distanceToMouse = Math.sqrt(dx * dx + dy * dy)

            let targetX = fish.targetX
            let targetY = fish.targetY
            let targetRotation = fish.targetRotation
            let isEscaping = false
            let newCircleAngle = fish.circleAngle || 0
            let newBurstTimer = fish.burstTimer || 0

            if (distanceToMouse < mouseAvoidDistance) {
              isEscaping = true
              const angle = Math.atan2(dy, dx)
              const forceStrength = 1 - (distanceToMouse / mouseAvoidDistance)
              const escapeSpeed = 5 + (forceStrength * 10) 
              
              const newX = fish.x - Math.cos(angle) * escapeSpeed
              const newY = fish.y - Math.sin(angle) * escapeSpeed
              
              targetX = fish.x - Math.cos(angle) * (mouseAvoidDistance * 1.2)
              targetY = fish.y - Math.sin(angle) * (mouseAvoidDistance * 1.2)
              
              targetRotation = (angle * 180 / Math.PI + 180) % 360
              
              return {
                ...fish,
                x: newX,
                y: newY,
                targetX,
                targetY,
                targetRotation,
                rotation: targetRotation, 
                glowIntensity: newGlowIntensity,
                glowDirection: newGlowDirection
              }
            } else {
              switch (fish.movementPattern) {
                case 'leftRight':
                  if (Math.random() < 0.03) {
                    targetRotation = fish.rotation > 180 ? 0 : 180
                    const radians = targetRotation * Math.PI / 180
                    targetX = fish.x + Math.cos(radians) * 200 * fish.speed
                    targetY = fish.y
                  }
                  break;
                  
                case 'circular':
                  if (fish.circleCenter && fish.circleRadius) {
                    newCircleAngle = (newCircleAngle + 0.01 * fish.speed) % (Math.PI * 2)
                    targetX = fish.circleCenter.x + Math.cos(newCircleAngle) * fish.circleRadius
                    targetY = fish.circleCenter.y + Math.sin(newCircleAngle) * fish.circleRadius
                    targetRotation = (newCircleAngle * 180 / Math.PI + 90) % 360
                    
                    if (Math.random() < 0.005) {
                      fish.circleRadius = 100 + Math.random() * 150
                    }
                  }
                  break;
                  
                case 'random':
                  if (Math.random() < 0.03) {
                    targetRotation = Math.random() * 360
                    const radians = targetRotation * Math.PI / 180
                    targetX = fish.x + Math.cos(radians) * 150 * fish.speed
                    targetY = fish.y + Math.sin(radians) * 150 * fish.speed
                  }
                  break;
                  
                case 'zigzag':
                  if (Math.random() < 0.04) {
                    targetRotation = (fish.rotation + 60 + Math.random() * 60) % 360
                    const radians = targetRotation * Math.PI / 180
                    targetX = fish.x + Math.cos(radians) * 80 * fish.speed
                    targetY = fish.y + Math.sin(radians) * 80 * fish.speed
                  }
                  break;
                  
                case 'burst':
                  newBurstTimer = (newBurstTimer + 1) % 120
                  
                  if (newBurstTimer < 30) {
                    const radians = fish.rotation * Math.PI / 180
                    targetX = fish.x + Math.cos(radians) * 8 * fish.speed
                    targetY = fish.y + Math.sin(radians) * 8 * fish.speed
                  } else if (newBurstTimer === 30) {
                    targetRotation = Math.random() * 360
                  }
                  break;
              }
            }

            const edgeMargin = 100
            
            const isNearEdge = 
              fish.x < edgeMargin || 
              fish.x > windowSize.width - edgeMargin ||
              fish.y < edgeMargin || 
              fish.y > windowSize.height - edgeMargin;
            
            if (isNearEdge) {
              return {
                ...fish,
                isExiting: true,
                exitProgress: 0
              }
            }

            const easing = isEscaping ? 0.2 : 0.05
            const newX = fish.x + (targetX - fish.x) * easing * fish.speed
            const newY = fish.y + (targetY - fish.y) * easing * fish.speed
            
            let rotDiff = targetRotation - fish.rotation
            if (rotDiff > 180) rotDiff -= 360
            if (rotDiff < -180) rotDiff += 360
            const newRotation = fish.rotation + rotDiff * 0.1 
            
            return {
              ...fish,
              x: newX,
              y: newY,
              rotation: newRotation,
              targetX,
              targetY,
              targetRotation,
              glowIntensity: newGlowIntensity,
              glowDirection: newGlowDirection,
              circleAngle: newCircleAngle,
              burstTimer: newBurstTimer
            }
          })
        })
      }

      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frameRef.current)
    }
  }, [fishes.length, mousePosition, windowSize, isGameModesPage])

  if (!isGameModesPage) return null

  return (
    <>
      <div 
        ref={containerRef} 
        className="fixed inset-0 pointer-events-none z-10" 
        style={{ overflow: 'hidden' }}
      >
        {fishes.map(fish => (
          <div
            key={fish.id}
            className="absolute pointer-events-auto swimming-fish"
            style={{
              left: fish.x,
              top: fish.y,
              transform: `rotate(${fish.rotation + (fish.isClicked ? fish.clickRotation : 0)}deg) scale(${fish.scale * (fish.isClicked ? fish.clickScale : 1)})`,
              opacity: fish.opacity,
              color: fish.color,
              zIndex: 10,
              width: '60px',
              height: '30px',
              transition: fish.isClicked ? 'none' : 'transform 0.1s ease-out'
            }}
            onClick={() => handleFishClick(fish.id)}
          >
            <div style={{ 
              filter: `drop-shadow(0 0 ${3 + fish.glowIntensity * 5}px ${fish.color})`,
              transition: 'filter 0.1s ease-in-out'
            }}>
              <Image 
                src="/img/catphish_white.svg"
                alt="Catfish"
                width={60}
                height={30}
                style={{ 
                  filter: `brightness(${1 + fish.glowIntensity * 0.5}) hue-rotate(${fish.id * 30}deg)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <Fireworks 
        isActive={showFireworks} 
        duration={5}
      />
      
      <AboutUsModal 
        isOpen={showAboutUsModal} 
        onClose={handleModalClose} 
      />
    </>
  )
}
