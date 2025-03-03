"use client"

import React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

export function GameModes() {
  useGSAP(() => {
    gsap.from(".game-mode", {
      opacity: 0,
      y: 50,
      duration: 0.8,
      stagger: 0.2,
      scrollTrigger: {
        trigger: ".game-modes",
        start: "top center",
      },
    })
  }, [])

  return (
    <section className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-arcade text-2xl md:text-4xl text-center mb-16 text-arcade-magenta neon-text glow-heading-pink">
          CHOOSE YOUR ADVENTURE
        </h2>

        <div className="grid md:grid-cols-2 gap-8 game-modes">
          <GameModeCard
            title="PHISH BLASTER"
            description="Rapid-fire challenge where you identify and blast phishing attempts before time runs out. Each level gets faster and more difficult!"
            color="red"
            href="/games/phish-blaster"
          />

          <GameModeCard
            title="SECURITY MAZE"
            description="Navigate through a corporate environment maze, avoiding phishing traps and collecting security badges. Watch out for the hackers!"
            color="cyan"
            href="/games/security-maze"
          />
        </div>
      </div>
    </section>
  )
}

function GameModeCard({ title, description, color, href }: {
  title: string
  description: string
  color: "red" | "cyan"
  href: string
}) {
  return (
    <motion.div
      className={`game-mode relative p-6 border-2 rounded-lg neon-border bg-arcade-bg/50 backdrop-blur-sm
        ${color === "red" ? "border-arcade-red" : "border-arcade-cyan"}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <h3 className={`font-arcade text-xl mb-4
        ${color === "red" ? "text-arcade-red glow-heading-pink" : "text-arcade-cyan glow-heading"}`}>
        {title}
      </h3>
      
      <p className="text-gray-300 mb-6">
        {description}
      </p>

      <Link
        href={href}
        className={`inline-block font-arcade text-sm px-6 py-2 border rounded
          ${color === "red" 
            ? "border-arcade-red text-arcade-red hover:bg-arcade-red" 
            : "border-arcade-cyan text-arcade-cyan hover:bg-arcade-cyan"} 
          hover:text-black transition-colors`}
      >
        PLAY NOW
      </Link>
    </motion.div>
  )
}
