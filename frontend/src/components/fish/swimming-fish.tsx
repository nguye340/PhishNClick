"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Fireworks } from '../effects/fireworks'
import { AboutUsModal } from '../modals/about-us-modal'
import { motion, AnimatePresence } from 'framer-motion'

// Fish colors
const FISH_COLORS: string[] = [
  '#00FFFF', // Cyan
  '#FF00FF', // Magenta
  '#FFFF00', // Yellow
  '#00FF00', // Green
  '#FF0000', // Red
  '#0088FF', // Blue
];

// Fish type definition
interface Fish {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  scale: number;
  color: string;
  isClicked: boolean;
  opacity: number;
  clickRotation: number;
  clickScale: number;
  glowIntensity: number;
  fadeInProgress?: boolean;
  fadeOutProgress?: boolean;
  avoidsCursor?: boolean;
  movementPattern?: 'zigzag' | 'circular' | 'straight';
  patternTimer?: number;
  zIndex: number;
}

export function SwimmingFish() {
  // Constants
  const MAX_SCORE = 12; // Maximum score to achieve

  const [fishes, setFishes] = useState<Fish[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHoveringFish, setIsHoveringFish] = useState(false);
  const [clickedCount, setClickedCount] = useState(0);
  const [showFireworks, setShowFireworks] = useState(false);
  const [showAboutUsModal, setShowAboutUsModal] = useState(false);
  const [showScorePopup, setShowScorePopup] = useState(false);
  const [scorePopupPosition, setScorePopupPosition] = useState({ x: 0, y: 0 });
  const [scorePopupColor, setScorePopupColor] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLandingPage, setIsLandingPage] = useState(true); // Track if we're on the landing page
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);
  const targetFPSRef = useRef<number>(60);
  const frameIntervalRef = useRef<number>(1000 / 60);
  const catchSoundRef = useRef<HTMLAudioElement | null>(null);
  const completeSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio elements
  useEffect(() => {
    // Create audio elements
    const catchSound = new Audio('/sounds/catchPhish.ogg');
    const completeSound = new Audio('/sounds/complete.mp3');
    
    // Set properties
    catchSound.volume = 0.7;
    completeSound.volume = 0.7;
    
    // Store references
    catchSoundRef.current = catchSound;
    completeSoundRef.current = completeSound;
    
    return () => {
      // Cleanup - properly handle refs without assigning null to .current
      if (catchSoundRef.current) {
        catchSoundRef.current.pause();
        catchSoundRef.current = null;
      }
      if (completeSoundRef.current) {
        completeSoundRef.current.pause();
        completeSoundRef.current = null;
      }
    };
  }, []);

  // Initialize fish
  useEffect(() => {
    if (!isLandingPage) return;
    
    const initialFishes = Array.from({ length: MAX_SCORE }).map((_, index) => {
      // Get viewport dimensions for proper positioning
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate safe boundaries (away from edges)
      const edgeBuffer = 100;
      
      // For the last fish, ensure it spawns in a good position
      let safeX, safeY;
      if (index === MAX_SCORE - 1) {
        // Place the last fish in the center area of the screen
        const centerX = viewportWidth / 2;
        const centerY = viewportHeight / 2;
        const centerBuffer = 200; // Area around center
        safeX = centerX - centerBuffer/2 + Math.random() * centerBuffer;
        safeY = centerY - centerBuffer/2 + Math.random() * centerBuffer;
      } else {
        // Normal spawning for other fish
        safeX = edgeBuffer + Math.random() * (viewportWidth - edgeBuffer * 2);
        safeY = edgeBuffer + Math.random() * (viewportHeight - edgeBuffer * 2);
      }
      
      // Determine fish speed - more variation
      const baseSpeed = 0.5 + Math.random() * 1.5; // Speed between 0.5 and 2.0
      const speedMultiplier = index % 3 === 0 ? 1.5 : 1; // Some fish are faster
      
      // Ensure fish are moving in different directions
      const angle = Math.random() * Math.PI * 2; // Random angle in radians
      const vx = Math.cos(angle) * baseSpeed * speedMultiplier;
      const vy = Math.sin(angle) * baseSpeed * speedMultiplier;
      
      return {
        id: index,
        x: safeX,
        y: safeY,
        vx,
        vy,
        rotation: Math.atan2(vy, vx) * (180 / Math.PI) + 90, // Calculate rotation based on direction
        scale: 0.8 + Math.random() * 0.7, // Scale between 0.8x and 1.5x
        color: FISH_COLORS[index % FISH_COLORS.length],
        avoidsCursor: index % 2 === 0, // Increase frequency of avoiding fish
        isClicked: false,
        fadeOutProgress: false,
        fadeInProgress: false,
        opacity: 1,
        zIndex: 10 + index,
        clickRotation: 0,
        clickScale: 1,
        glowIntensity: 0,
        movementPattern: 'straight' as 'zigzag' | 'circular' | 'straight',
        patternTimer: 0
      };
    });
    
    setFishes(initialFishes);
  }, [isLandingPage]);

  // Function to check if there are visible fish on screen
  const checkVisibleFishOnScreen = useCallback(() => {
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Buffer to consider fish near the edge as not fully visible
    const visibilityBuffer = 100;
    
    // Count fish that are fully visible on screen
    const visibleFishCount = fishes.filter(fish => {
      // Skip clicked or fading fish
      if (fish.isClicked || fish.fadeOutProgress || fish.opacity < 0.8) return false;
      
      // Check if fish is fully visible on screen (with buffer)
      const isOnScreen = 
        fish.x > visibilityBuffer && 
        fish.x < viewportWidth - visibilityBuffer && 
        fish.y > visibilityBuffer && 
        fish.y < viewportHeight - visibilityBuffer;
        
      return isOnScreen;
    }).length;
    
    return visibleFishCount;
  }, [fishes]);

  // Ensure there are always fish on screen
  useEffect(() => {
    if (!isLandingPage) return;
    
    const ensureFishOnScreen = () => {
      const visibleCount = checkVisibleFishOnScreen();
      
      // If no fish are visible on screen, force respawn some fish
      if (visibleCount === 0) {
        const remainingToClick = MAX_SCORE - clickedCount;
        
        // Only respawn if we still have fish to catch
        if (remainingToClick > 0) {
          setFishes(prevFishes => {
            // Find fish that are off-screen or invisible to respawn
            const fishesToUpdate = prevFishes
              .filter(fish => !fish.isClicked && (fish.opacity < 0.5 || fish.fadeOutProgress))
              .slice(0, Math.min(3, remainingToClick)); // Respawn up to 3 fish at once
            
            if (fishesToUpdate.length === 0) return prevFishes;
            
            // Create updated fish array
            return prevFishes.map(fish => {
              if (fishesToUpdate.some(f => f.id === fish.id)) {
                // Get viewport dimensions
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                // Calculate safe spawn area (center of screen)
                const centerBuffer = 200;
                const centerX = viewportWidth / 2;
                const centerY = viewportHeight / 2;
                const safeX = centerX - centerBuffer + Math.random() * centerBuffer * 2;
                const safeY = centerY - centerBuffer + Math.random() * centerBuffer * 2;
                
                // Determine fish speed and direction
                const angle = Math.random() * Math.PI * 2;
                const speed = 0.5 + Math.random() * 1.5;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                
                return {
                  ...fish,
                  x: safeX,
                  y: safeY,
                  vx,
                  vy,
                  rotation: Math.atan2(vy, vx) * (180 / Math.PI) + 90,
                  opacity: 0.1,
                  fadeOutProgress: false,
                  fadeInProgress: true
                };
              }
              return fish;
            });
          });
        }
      }
    };
    
    // Check initially
    ensureFishOnScreen();
    
    // Set up interval to periodically check
    const interval = setInterval(ensureFishOnScreen, 2000);
    
    return () => clearInterval(interval);
  }, [isLandingPage, clickedCount, checkVisibleFishOnScreen]);

  // Animation frame for smooth movement with performance optimizations
  useEffect(() => {
    if (!isLandingPage) return;
    
    // Use timestamp-based throttling for consistent frame rate
    const targetFPS = 30; // Reduced from 60 for better performance
    const frameInterval = 1000 / targetFPS;
    let lastFrameTime = 0;
    
    // Start animation loop with throttling
    const animate = (timestamp: number) => {
      // Skip frames to maintain target FPS
      const elapsed = timestamp - lastFrameTime;
      if (elapsed > frameInterval) {
        lastFrameTime = timestamp - (elapsed % frameInterval);
        setFishes(prevFishes => updateFishPositions(prevFishes));
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Clean up animation frame on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isLandingPage]);
  
  // Memoized function to update fish positions with performance optimizations
  const updateFishPositions = useCallback((prevFishes: Fish[]) => {
    // Get viewport dimensions - cache these values to avoid repeated DOM access
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Only process visible and active fish for better performance
    return prevFishes.map(fish => {
      // Handle clicked fish animation
      if (fish.isClicked) {
        // If fish is clicked, continue the fade out animation
        const newOpacity = fish.opacity - 0.07; // Faster fade out
        if (newOpacity <= 0) {
          // Calculate how many fish we need visible
          const remainingToClick = MAX_SCORE - clickedCount;
          const activeCount = prevFishes.filter(f => !f.isClicked && f.opacity > 0.5).length;
          
          // Only respawn if we still have fish to catch
          if (activeCount < remainingToClick) {
            // Reset fish when fully faded
            // Get viewport dimensions for proper positioning
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Calculate safe boundaries (away from edges)
            const edgeBuffer = 100;
            const safeX = edgeBuffer + Math.random() * (viewportWidth - edgeBuffer * 2);
            const safeY = edgeBuffer + Math.random() * (viewportHeight - edgeBuffer * 2);
            
            // Determine fish speed - more variation
            const baseSpeed = 0.5 + Math.random() * 2; // Speed between 0.5 and 2.5
            const speedMultiplier = fish.avoidsCursor ? 1.5 : 1;
            
            return {
              ...fish,
              x: safeX,
              y: safeY,
              vx: (Math.random() - 0.5) * baseSpeed * speedMultiplier,
              vy: (Math.random() - 0.5) * baseSpeed * speedMultiplier,
              rotation: Math.random() * 360,
              isClicked: false,
              opacity: 0.1, // Start with slight visibility for smoother transition
              clickRotation: 0,
              clickScale: 1,
              fadeInProgress: true
            };
          } else {
            // Don't respawn this fish, just keep it invisible
            return {
              ...fish,
              opacity: 0,
              isClicked: true,
              clickRotation: 0,
              clickScale: 1
            };
          }
        }
        return {
          ...fish,
          opacity: newOpacity,
          clickRotation: fish.clickRotation + 20, // Faster spin
          clickScale: Math.max(0.1, fish.clickScale - 0.08) // Faster zoom out
        };
      }
      
      // Skip updating clicked fish
      if (fish.isClicked) {
        return fish;
      }
      
      // Handle fade in animation
      if (fish.fadeInProgress) {
        const newOpacity = fish.opacity + 0.05;
        if (newOpacity >= 1) {
          return {
            ...fish,
            opacity: 1,
            fadeInProgress: false
          };
        } else {
          return {
            ...fish,
            opacity: newOpacity
          };
        }
      }
      
      // Calculate new position
      let vx = fish.vx;
      let vy = fish.vy;
      
      // Apply cursor avoidance if this fish avoids the cursor
      if (fish.avoidsCursor) {
        const distX = mousePosition.x - fish.x;
        const distY = mousePosition.y - fish.y;
        const distance = Math.sqrt(distX * distX + distY * distY);
        
        // If mouse is close, swim away more aggressively
        if (distance < 200) { // Increased detection range
          const angle = Math.atan2(distY, distX);
          // Stronger repulsion force with sharper falloff
          const repulsionForce = 0.3 * (1 - Math.pow(distance / 200, 2)); 
          
          // Apply stronger avoidance force
          vx -= Math.cos(angle) * repulsionForce * 2;
          vy -= Math.sin(angle) * repulsionForce * 2;
          
          // Add a bit of randomness to make the movement more erratic when avoiding
          vx += (Math.random() - 0.5) * 0.3;
          vy += (Math.random() - 0.5) * 0.3;
          
          // Increase speed when avoiding
          const currentSpeed = Math.sqrt(vx * vx + vy * vy);
          const targetSpeed = 3 + Math.random() * 2; // Faster escape speed
          if (currentSpeed < targetSpeed) {
            const speedFactor = targetSpeed / currentSpeed;
            vx *= speedFactor;
            vy *= speedFactor;
          }
        }
      }
      
      // Calculate new position
      let newX = fish.x + vx;
      let newY = fish.y + vy;
      
      // Check if fish is near any edge
      const edgeBuffer = 60; // Increased buffer for smoother transitions
      const nearLeftEdge = newX < edgeBuffer;
      const nearRightEdge = newX > viewportWidth - 60;
      const nearTopEdge = newY < edgeBuffer;
      const nearBottomEdge = newY > viewportHeight - 30;
      
      // Special handling for fish at the bottom - respawn at top
      if (nearBottomEdge && !fish.fadeOutProgress && !fish.fadeInProgress && !fish.isClicked) {
        // Calculate new position at the top of the screen
        const safeX = Math.max(edgeBuffer, Math.min(newX, viewportWidth - edgeBuffer));
        
        return {
          ...fish,
          x: safeX,
          y: edgeBuffer, // Position at the top
          opacity: 0.1, // Start with slight visibility
          fadeInProgress: true,
          // Keep the same horizontal direction but reverse vertical
          vx: fish.vx,
          vy: Math.abs(fish.vy) * (Math.random() > 0.5 ? 1 : -1), // Randomize vertical direction
          rotation: fish.rotation + 180 // Flip the fish
        };
      }
      
      // If fish is near other edges, start fade out
      if ((nearLeftEdge || nearRightEdge || nearTopEdge) && !fish.fadeOutProgress && !fish.fadeInProgress && !fish.isClicked) {
        return {
          ...fish,
          fadeOutProgress: true,
          x: newX,
          y: newY,
          vx, 
          vy,
          rotation: fish.rotation
        };
      }
      
      // Fade out animation for fish near edges
      if (fish.fadeOutProgress) {
        const newOpacity = fish.opacity - 0.05;
        if (newOpacity <= 0) {
          // Calculate how many fish we need visible
          const remainingToClick = MAX_SCORE - clickedCount;
          const activeCount = prevFishes.filter(f => !f.isClicked && !f.fadeOutProgress && f.opacity > 0.5).length - 1; // -1 for this fish
          
          // Only respawn if we need more fish to reach the remaining target
          if (activeCount < remainingToClick) {
            // Get viewport dimensions for proper positioning
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Determine which edge to spawn from (avoiding the last fish being special)
            const spawnEdge = Math.floor(Math.random() * 3); // 0: left, 1: right, 2: top
            let safeX, safeY, newVx, newVy;
            
            const safeEdgeBuffer = 100;
            
            if (spawnEdge === 0) { // Left edge
              safeX = edgeBuffer;
              safeY = safeEdgeBuffer + Math.random() * (viewportHeight - safeEdgeBuffer * 2);
              newVx = Math.abs(fish.vx) || (0.5 + Math.random() * 1.5); // Ensure moving right
              newVy = (Math.random() - 0.5) * 2;
            } else if (spawnEdge === 1) { // Right edge
              safeX = viewportWidth - edgeBuffer;
              safeY = safeEdgeBuffer + Math.random() * (viewportHeight - safeEdgeBuffer * 2);
              newVx = -Math.abs(fish.vx) || -(0.5 + Math.random() * 1.5); // Ensure moving left
              newVy = (Math.random() - 0.5) * 2;
            } else { // Top edge
              safeX = safeEdgeBuffer + Math.random() * (viewportWidth - safeEdgeBuffer * 2);
              safeY = edgeBuffer;
              newVx = (Math.random() - 0.5) * 2;
              newVy = Math.abs(fish.vy) || (0.5 + Math.random() * 1.5); // Ensure moving down
            }
            
            // Calculate rotation based on direction
            const newRotation = Math.atan2(newVy, newVx) * (180 / Math.PI) + 90;
            
            return {
              ...fish,
              x: safeX,
              y: safeY,
              vx: newVx,
              vy: newVy,
              rotation: newRotation,
              opacity: 0.1, // Start with slight visibility for smoother transition
              fadeOutProgress: false,
              fadeInProgress: true,
              clickRotation: 0,
              clickScale: 1,
              glowIntensity: 0
            };
          } else {
            // Don't respawn this fish, just keep it invisible
            return {
              ...fish,
              opacity: 0,
              fadeOutProgress: false
            };
          }
        }
        
        return {
          ...fish,
          opacity: newOpacity,
          x: newX,
          y: newY
        };
      }
      
      // Calculate fish rotation based on movement direction
      const targetRotation = Math.atan2(vy, vx) * (180 / Math.PI) + 90;
      
      // Smoothly interpolate rotation
      let newRotation = fish.rotation;
      const rotationDiff = targetRotation - fish.rotation;
      
      // Handle angle wrapping
      if (rotationDiff > 180) {
        newRotation += (rotationDiff - 360) * 0.1;
      } else if (rotationDiff < -180) {
        newRotation += (rotationDiff + 360) * 0.1;
      } else {
        newRotation += rotationDiff * 0.1;
      }
      
      // Return updated fish
      return {
        ...fish,
        x: newX,
        y: newY,
        vx,
        vy,
        rotation: newRotation
      };
    });
  }, [mousePosition]);

  // Handle fish click
  const handleFishClick = (id: number) => {
    // Find the clicked fish
    const clickedFishIndex = fishes.findIndex(fish => fish.id === id);
    if (clickedFishIndex === -1) return;
    
    // Don't allow clicking already clicked fish
    if (fishes[clickedFishIndex].isClicked) return;
    
    // Play catch sound
    if (catchSoundRef.current) {
      catchSoundRef.current.currentTime = 0; // Reset sound to start
      catchSoundRef.current.play().catch(err => console.log('Audio play error:', err));
    }
    
    // Show score popup
    setScorePopupPosition({ x: fishes[clickedFishIndex].x, y: fishes[clickedFishIndex].y });
    setScorePopupColor(fishes[clickedFishIndex].color);
    setShowScorePopup(true);

    // Hide score popup after animation
    setTimeout(() => {
      setShowScorePopup(false);
    }, 1000);
    
    // Update fish state to show it's been clicked
    setFishes(prevFishes => {
      const newFishes = [...prevFishes];
      newFishes[clickedFishIndex] = {
        ...newFishes[clickedFishIndex],
        isClicked: true,
        fadeOutProgress: false,
        fadeInProgress: false,
        clickRotation: 0,
        clickScale: 1,
        glowIntensity: 1.5 // Start with max glow
      };
      return newFishes;
    });
    
    // Increment clicked count
    setClickedCount(prevCount => {
      const newCount = prevCount + 1;
      
      // Check if all fish have been clicked
      if (newCount === MAX_SCORE) {
        // Play completion sound
        if (completeSoundRef.current) {
          completeSoundRef.current.play().catch(err => console.log('Audio play error:', err));
        }

        setShowFireworks(true);
        setTimeout(() => {
          setShowAboutUsModal(true);
        }, 2000);
      }
      
      return newCount;
    });
  };

  // Reset fish when modal is closed
  const handleModalClose = () => {
    setShowAboutUsModal(false);
    setShowFireworks(false);

    // Reset all fish
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();

      setFishes(prevFishes => {
        return prevFishes.map(fish => ({
          ...fish,
          x: Math.random() * (containerRect.width - 100),
          y: Math.random() * (containerRect.height - 100),
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          rotation: Math.random() * 360,
          isClicked: false,
          opacity: 1,
          clickRotation: 0,
          clickScale: 1,
          glowIntensity: 0,
          movementPattern: 'straight' as 'zigzag' | 'circular' | 'straight',
          patternTimer: 0
        }));
      });
    }

    setClickedCount(0);
  };

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50); // Show when less than 50px scrolled
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update custom cursor when hovering fish
  useEffect(() => {
    const cursor = document.querySelector('.custom-cursor');
    if (cursor) {
      if (isHoveringFish) {
        cursor.classList.add('hover-fish');
      } else {
        cursor.classList.remove('hover-fish');
      }
    }
  });

  // Track if we're on the landing page
  useEffect(() => {
    // Function to check if we're on the landing page
    const checkIfLandingPage = () => {
      // Check if we're on the landing page (root path)
      const isRoot = window.location.pathname === '/' || window.location.pathname === '';
      setIsLandingPage(isRoot);
    };

    // Check initially
    checkIfLandingPage();

    // Listen for route changes
    window.addEventListener('popstate', checkIfLandingPage);
    
    // For Next.js route changes
    const handleRouteChange = () => {
      setTimeout(checkIfLandingPage, 50); // Small delay to ensure DOM is updated
    };
    
    // Try to use Next.js router events if available
    try {
      const nextRouter = (window as any).__NEXT_DATA__?.router;
      if (nextRouter) {
        nextRouter.events?.on('routeChangeComplete', handleRouteChange);
      }
    } catch (e) {
      console.log('Next router not available for event binding');
    }
    
    // Add a mutation observer as a fallback to detect URL changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          handleRouteChange();
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href']
    });

    return () => {
      window.removeEventListener('popstate', checkIfLandingPage);
      try {
        const nextRouter = (window as any).__NEXT_DATA__?.router;
        if (nextRouter) {
          nextRouter.events?.off('routeChangeComplete', handleRouteChange);
        }
      } catch (e) {
        // Ignore
      }
      observer.disconnect();
    };
  }, []);

  // Track mouse position
  useEffect(() => {
    if (!isLandingPage) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return function(): void {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isLandingPage]);

  return (
    <>
      {isLandingPage && (
        <div
          ref={containerRef}
          className="fixed inset-0 pointer-events-none z-10"
          style={{ 
            overflow: 'hidden',
            height: '100vh',  // Limit to viewport height
            maxHeight: '100vh' // Ensure it doesn't exceed viewport
          }}
        >
          {fishes.map(fish => (
            <div
              key={fish.id}
              className="absolute pointer-events-auto swimming-fish"
              style={{
                left: fish.x - 10, // Smaller hit box
                top: fish.y - 10,  // Smaller hit box
                transform: `rotate(${fish.rotation + (fish.isClicked ? fish.clickRotation : 0)}deg) scale(${fish.scale * (fish.isClicked ? fish.clickScale : 1)})`,
                opacity: fish.opacity,
                color: fish.color,
                zIndex: 10,
                width: '60px',  // Reduced from 100px
                height: '40px',  // Reduced from 70px
                transition: fish.isClicked ? 'none' : 'transform 0.1s ease-out, filter 0.2s ease',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                padding: '10px', // Reduced padding
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => handleFishClick(fish.id)}
            >
              <div
                className="fish-inner"
                style={{
                  filter: `drop-shadow(0 0 ${5 + fish.glowIntensity * 10}px ${fish.color})`,
                  transition: 'filter 0.1s ease-in-out, transform 0.2s ease',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                  transform: fish.isClicked ? 'scale(0.8) rotate(180deg)' : 'scale(1)'
                }}
              >
                <Image
                  src="/img/catphish_white_centered.svg"
                  alt="Catfish"
                  width={60}
                  height={30}
                  style={{
                    filter: `brightness(${1 + fish.glowIntensity * 0.8}) hue-rotate(${fish.id * 30}deg) ${fish.avoidsCursor ? 'saturate(1.5)' : ''}`,
                  }}
                  className="fish-image"
                />
              </div>
            </div>
          ))}

          {/* Score display */}
          <div className="fixed top-24 right-8 z-50 bg-arcade-bg/80 backdrop-blur-sm p-4 rounded-lg border border-arcade-cyan/30 shadow-glow-sm">
            <div className="font-arcade text-2xl text-arcade-cyan glow-heading">
              Score: {clickedCount} / {MAX_SCORE}
            </div>
            <div className="font-terminal text-sm text-white/70 mt-1">
              Catch all the phish!
            </div>
          </div>

          {/* Score popup animation */}
          <AnimatePresence>
            {showScorePopup && (
              <motion.div
                initial={{ opacity: 0, y: 0, scale: 0.5 }}
                animate={{ opacity: 1, y: -50, scale: 1.2 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.8 }}
                className="absolute pointer-events-none"
                style={{
                  left: scorePopupPosition.x + 30,
                  top: scorePopupPosition.y,
                  color: scorePopupColor,
                  zIndex: 20,
                  fontWeight: 'bold',
                  textShadow: `0 0 8px ${scorePopupColor}`
                }}
              >
                <span className="font-arcade text-2xl">+1</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Blinking instruction text */}
          <div 
            className={`fixed bottom-10 left-0 right-0 text-center z-20 pointer-events-none transition-opacity duration-300 ease-in-out ${
              isScrolled ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <p className="font-arcade text-lg text-arcade-cyan blinking-text">
              {/* Catch all the phish and find out... */}
            </p>
          </div>
        </div>
      )}

      <Fireworks
        isActive={showFireworks}
        duration={5}
      />

      <AboutUsModal
        isOpen={showAboutUsModal}
        onClose={handleModalClose}
      />

      {/* Hidden audio elements for preloading */}
      <audio src="/sounds/catchPhish.ogg" preload="auto" style={{ display: 'none' }} />
      <audio src="/sounds/complete.mp3" preload="auto" style={{ display: 'none' }} />
    </>
  )
}
