"use client"

import React from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface AboutUsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AboutUsModal({ isOpen, onClose }: AboutUsModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="w-full max-w-2xl mx-auto bg-arcade-bg border-2 border-arcade-cyan rounded-lg shadow-2xl overflow-hidden pointer-events-auto"
              style={{ maxWidth: '90vw' }}
            >
              <div className="relative p-6 text-center">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="flex flex-col items-center gap-6 text-center mx-auto">
                  <div className="w-32 h-32 relative flex items-center justify-center">
                    <Image
                      src="/img/catphish_white.svg"
                      alt="Catphish Logo"
                      width={120}
                      height={60}
                      className="object-contain filter drop-shadow-glow-cyan"
                    />
                  </div>

                  <h2 className="font-arcade text-3xl text-arcade-cyan glow-heading vhs-aberration">
                    CONGRATULATIONS!
                  </h2>
                  
                  <div className="vhs-text font-terminal text-lg text-white space-y-4">
                    <p className="text-arcade-green">
                      You've spotted all the (cat)phish!
                    </p>
                    
                    <h3 className="font-arcade text-xl text-arcade-magenta mt-6 mb-2">
                      ABOUT TEAM CATPHISH
                    </h3>
                    
                    <p>
                      We are a team of cybersecurity analysts dedicated to making security education fun and engaging.
                    </p>
                    
                    <p>
                      Our mission is to prepare you for real-world phishing attacks through interactive simulations that feel like games but teach critical security skills.
                    </p>
                    
                    <p className="text-arcade-yellow">
                      Phish N Click is a fun, engaging way to learn how to protect yourself from cyber threats. Our phishing attack simulations serve as drills to prepare you for the real deal.
                    </p>
                    
                    <div className="pt-4 pb-2 flex justify-center">
                      <button
                        onClick={onClose}
                        className="font-arcade text-lg px-8 py-3 bg-arcade-green text-white rounded-lg transition-colors hover:bg-opacity-90 vhs-effect"
                      >
                        <span className="relative z-10 glow-heading">CONTINUE</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
