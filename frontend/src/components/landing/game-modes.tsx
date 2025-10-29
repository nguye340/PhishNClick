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
    <section id="choose-your-adventure" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-arcade text-2xl md:text-4xl text-center mb-16 text-arcade-magenta neon-text glow-heading-pink">
          CHOOSE YOUR ADVENTURE
        </h2>

        <div className="grid md:grid-cols-2 gap-8 game-modes">
          <GameModeCard
            title="POP-UP MANIC"
            description="Click smart, close fast! Malicious pop-ups flood your screen while benign ones hide among them. React with speed and precision—close the wrong one, and you lose points, or worse!"
            color="magenta"
            href="/games/popup-manic"
          />

          <GameModeCard
            title="PHISH404"
            description="Jump over scams before they jump you. A side-scroller where your catphish hero leaps past waves of inbox hazards, training you to recognize threats through pure instinct."
            color="cyan"
            href="/games/phish404"
          />

          <GameModeCard
            title="PHISH-HUNT"
            description="Shoot the phish, not the facts. Like Duck Hunt for cyber threats. Take aim at sketchy messages—miss one, and it might just be a real-world breach. Levels scale from rookie spam to red-team bait."
            color="green"
            href="/games/phish-hunt"
          />

          <GameModeCard
            title="HOOKED OR COOKED"
            description="Bite or bail — the inbox is your fishing ground. Fish icons hide emails—some safe, others sinister. Read, react, and reel in the legit ones while tossing the phish. Fast eyes win the game."
            color="yellow"
            href="/games/hooked-or-cooked"
          />
        </div>
      </div>
    </section>
  )
}

function GameModeCard({ title, description, color, href }: {
  title: string
  description: string
  color: "magenta" | "cyan" | "green" | "yellow"
  href: string
}) {
  return (
    <motion.div
      className={`game-mode group relative p-6 border-2 rounded-lg neon-border bg-arcade-bg/50 backdrop-blur-sm
        ${color === "magenta" ? "border-arcade-magenta" : 
          color === "cyan" ? "border-arcade-cyan" : 
          color === "green" ? "border-arcade-green" : 
          "border-arcade-yellow"}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <h3 className={`font-arcade text-xl mb-4
        ${color === "magenta" ? "text-arcade-magenta glow-heading-pink" : 
          color === "cyan" ? "text-arcade-cyan glow-heading" : 
          color === "green" ? "text-arcade-green glow-heading-green" : 
          "text-arcade-yellow glow-heading-yellow"}`}>
        {title}
      </h3>
      
      <p className={`mb-6 text-gray-300 transition-colors duration-300 font-terminal text-lg
        ${color === "magenta" ? "group-hover:text-arcade-cyan" : 
          color === "cyan" ? "group-hover:text-arcade-green" : 
          color === "green" ? "group-hover:text-arcade-yellow" : 
          "group-hover:text-arcade-magenta"}`}>
        {description}
      </p>

      <Link
        href={href}
        className={`inline-block font-arcade text-sm px-6 py-2 border rounded transition-all duration-200
          ${color === "magenta" 
            ? "border-arcade-magenta text-arcade-white hover:bg-arcade-cyan" 
            : color === "cyan"
            ? "border-arcade-cyan text-arcade-white hover:bg-arcade-green"
            : color === "green"
            ? "border-arcade-green text-arcade-white hover:bg-arcade-yellow"
            : "border-arcade-yellow text-arcade-white hover:bg-arcade-magenta"} 
          [&:hover]:text-black`}
      >
        PLAY NOW
      </Link>
    </motion.div>
  )
}
