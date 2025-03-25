"use client"

import React from "react"
import { motion } from "framer-motion"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Fish } from "lucide-react"
import { RiveMainCharacter } from "../../components/rive"

export function AssessmentIntro() {
  useGSAP(() => {
    gsap.from(".intro-content", {
      opacity: 0,
      y: 30,
      duration: 0.8,
      stagger: 0.2,
    })
  }, [])

  return (
    <section className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="intro-content mb-8"
        >
          <Fish className="w-16 h-16 mx-auto text-arcade-cyan" />
        </motion.div>

        <h1 className="intro-content font-arcade text-3xl md:text-4xl mb-6 text-arcade-cyan neon-text">
          PHISHY
        </h1>

        <div className="intro-content mb-8 inline-flex items-center gap-2 bg-arcade-yellow/20 px-4 py-2 rounded-lg">
          <div className="w-2 h-2 bg-arcade-yellow rounded-full animate-pulse" />
          <p className="text-arcade-yellow font-arcade text-sm">
            LEVEL 1-3
          </p>
        </div>

        <div className="intro-content space-y-6 text-lg text-gray-300 mb-12">
          <p>
            Welcome to your initial phishing awareness assessment! 
          </p>
          <p>
            Let&apos;s find out how well you can spot phishing attempts. Your performance here will determine your starting level.
          </p>
        </div>

        <motion.button
          className="intro-content font-arcade text-lg px-8 py-4 bg-arcade-cyan text-black rounded-lg hover:bg-opacity-90 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            // Scroll to test section
            document.querySelector(".phishing-test")?.scrollIntoView({ behavior: "smooth" })
          }}
        >
          START TEST
        </motion.button>
      </div>
      
      {/* Character positioned at the left side but shifted right */}
      <RiveMainCharacter 
        position="left"
        isAbsolute={true}
        className="left-[20%]" // Move character 20% from the left edge
      />
    </section>
  )
}

export default AssessmentIntro;
