"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Fish, LogIn, User, Settings, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { FlickeringTitle } from "./flickering-title"
import Image from "next/image"
import { AboutUsModal } from "../modals/about-us-modal"

export function LandingHero() {
  const router = useRouter()
  const [isButtonPressed, setIsButtonPressed] = useState(false)
  const [isLoginPressed, setIsLoginPressed] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)

  const handleInsertCoin = () => {
    setIsButtonPressed(true)
    // Navigate after a short delay to allow the animation to play
    setTimeout(() => {
      router.push("/assessment/phishing-test")
    }, 1000)
  }

  const handleLogin = () => {
    setIsLoginPressed(true)
    // Navigate after a short delay to allow the animation to play
    setTimeout(() => {
      router.push("/auth/login")
    }, 1000)
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
      <section className="min-h-screen relative overflow-hidden">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-arcade-bg/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative w-8 h-8">
                <Image 
                  src="/img/catphish_white.svg" 
                  alt="Catphish Logo" 
                  fill 
                  className="object-contain filter drop-shadow-glow-cyan"
                />
              </div>
              <span className="font-arcade text-arcade-cyan glow-heading">CatPhish</span>
            </Link>

            <div className="flex items-center gap-6">
              <button 
                onClick={() => setShowAboutModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded text-arcade-yellow hover:text-arcade-cyan transition-colors"
              >
                <Info className="w-4 h-4" />
                <span className="font-terminal text-sm">About Us</span>
              </button>
              <button 
                onClick={handleLogin}
                className={`flex items-center gap-2 px-4 py-2 rounded border border-arcade-cyan text-arcade-cyan hover:bg-arcade-cyan hover:text-black transition-colors group vhs-effect ${isLoginPressed ? 'active' : ''}`}
              >
                <LogIn className="w-4 h-4" />
                <span className="font-terminal text-sm">Login</span>
              </button>
              <Link 
                href="/auth/register" 
                className="flex items-center gap-2 px-4 py-2 rounded bg-arcade-magenta text-black hover:bg-opacity-90 transition-colors vhs-effect"
              >
                <User className="w-4 h-4" />
                <span className="font-terminal text-sm">Register</span>
              </Link>
              <button className="hover:text-arcade-cyan transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </nav>

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

              <div className="hero-content flex flex-col sm:flex-row gap-6 justify-center">
                <button 
                  onClick={handleInsertCoin}
                  className={`coin-button relative font-arcade text-xl px-10 py-5 bg-arcade-green text-white rounded-lg transition-colors group ${isButtonPressed ? 'active' : ''}`}
                >
                  <span className="relative z-10 vhs-aberration glow-heading">Insert Coin</span>
                  <div className="vhs-noise"></div>
                  <div className="vhs-glitch"></div>
                </button>
                <button 
                  onClick={handleLogin}
                  className={`login-button relative font-arcade text-xl px-10 py-5 border-2 border-arcade-cyan text-arcade-cyan rounded-lg transition-colors group ${isLoginPressed ? 'active' : ''}`}
                >
                  <span className="relative z-10 vhs-aberration glow-heading">Login</span>
                  <div className="vhs-noise"></div>
                  <div className="vhs-glitch"></div>
                </button>
              </div>

              <div className="hero-content flex items-center justify-center gap-12 text-lg font-terminal vhs-text">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-arcade-green rounded-full animate-pulse"></div>
                  <span className="text-arcade-green glow-heading">1,234 Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-arcade-magenta rounded-full animate-pulse"></div>
                  <span className="text-arcade-magenta glow-heading">50K+ Players</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <AboutUsModal 
        isOpen={showAboutModal} 
        onClose={() => setShowAboutModal(false)} 
      />
    </>
  )
}
