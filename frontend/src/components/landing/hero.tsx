"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { useRouter } from "next/navigation"
import { Github } from "lucide-react"
import { FlickeringTitle } from "./flickering-title"
import { Navbar } from "../layout/navbar"

export function LandingHero() {
  const router = useRouter()
  const [isButtonPressed, setIsButtonPressed] = useState(false)
  const coinSoundRef = React.useRef<HTMLAudioElement | null>(null);
  const onlineEnv = process.env.NEXT_PUBLIC_ONLINE_COUNT
  const totalPlayersEnv = process.env.NEXT_PUBLIC_TOTAL_PLAYERS
  const onlineCount = onlineEnv ? Number(onlineEnv) : NaN
  const totalPlayers = totalPlayersEnv ? Number(totalPlayersEnv) : NaN
  const showOnline = Number.isFinite(onlineCount) && onlineCount >= 50
  const showPlayers = Number.isFinite(totalPlayers) && totalPlayers >= 1000
  const formatNumber = (n: number) => new Intl.NumberFormat().format(n)
  const formatPlayers = (n: number) => n >= 10000 ? `${Math.round(n / 1000)}K+` : formatNumber(n)

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      coinSoundRef.current = new Audio('/sounds/game-start-6104.mp3');
      coinSoundRef.current.preload = 'auto';
    }
    
    return () => {
      if (coinSoundRef.current) {
        coinSoundRef.current.pause();
        coinSoundRef.current = null;
      }
    };
  }, []);

  const handleInsertCoin = () => {
    setIsButtonPressed(true)
    
    // Play coin sound
    if (coinSoundRef.current) {
      coinSoundRef.current.currentTime = 0; // Reset sound to start
      coinSoundRef.current.play().catch(err => console.log('Audio play error:', err));
    }
    
    // Clean up cursor before navigation to prevent double cursor
    const cleanupCursor = () => {
      // Remove any existing animation frames
      const rafIds: number[] = [];
      let rafId = requestAnimationFrame(function cleanup() {
        const nextRafId = requestAnimationFrame(cleanup);
        rafIds.push(nextRafId);
      });
      rafIds.push(rafId);
      
      // Cancel all animation frames after a short delay
      setTimeout(() => {
        rafIds.forEach(id => cancelAnimationFrame(id));
        // Navigate to the next page
        router.push("/games/popup-manic");
      }, 50);
    };
    
    // Navigate after a short delay to allow the animation to play
    setTimeout(cleanupCursor, 950);
  }


  useGSAP(() => {
    gsap.from(".hero-content", {
      opacity: 0,
      y: 30,
      duration: 0.8,
      stagger: 0.2,
    })
  }, [])

  return (
    <>
      <Navbar />
      <section className="min-h-screen relative overflow-hidden">

        {/* Hero Content */}
        <div className="relative pt-24 flex min-h-screen items-center">
          <div className="absolute inset-0 grid-bg opacity-20"></div>
          
          <div className="container mx-auto px-4 py-16 flex flex-col items-center gap-12">
            <div className="text-center space-y-12 max-w-4xl mx-auto">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <FlickeringTitle />
                <p className="hero-content font-terminal text-2xl md:text-3xl text-gray-200 vhs-text">
                  Level Up Your Security Skills
                </p>
              </motion.div>

              <p className="hero-content font-terminal text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto vhs-text leading-relaxed">
                An arcade-style cybersecurity training platform that turns phishing awareness into an epic gaming adventure.
              </p>

              <div className="hero-content flex flex-col sm:flex-row gap-6 justify-center items-center">
                <button 
                  onClick={handleInsertCoin}
                  className={`coin-button relative font-arcade text-xl px-10 py-5 bg-arcade-green text-white rounded-lg transition-colors group ${isButtonPressed ? 'active' : ''}`}
                >
                  <span className="relative z-10 vhs-aberration glow-heading">Insert Coin</span>
                  <div className="vhs-noise"></div>
                  <div className="vhs-glitch"></div>
                </button>
                
                <a
                  href="https://github.com/nguye340/PhishNClick"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 font-terminal text-lg px-8 py-4 bg-gray-800 text-white rounded-lg border-2 border-gray-600 transition-all transform hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-600/30 hover:border-arcade-cyan active:translate-y-0"
                >
                  <Github className="w-6 h-6" />
                  View on GitHub
                </a>
              </div>

              {(showOnline || showPlayers) && (
                <div className="hero-content flex items-center justify-center gap-12 text-lg font-terminal vhs-text">
                  {showOnline && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-arcade-green rounded-full animate-pulse"></div>
                      <span className="text-arcade-green glow-heading">{formatNumber(onlineCount)} Online</span>
                    </div>
                  )}
                  {showPlayers && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-arcade-magenta rounded-full animate-pulse"></div>
                      <span className="text-arcade-magenta glow-heading">{formatPlayers(totalPlayers)} Players</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
