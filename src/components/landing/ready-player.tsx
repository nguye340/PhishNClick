"use client"

import React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

export function ReadyPlayer() {
  useGSAP(() => {
    gsap.from(".ready-player", {
      opacity: 0,
      y: 30,
      duration: 1,
      scrollTrigger: {
        trigger: ".ready-player",
        start: "top center+=100",
      },
    })

    // Blinking text animation
    gsap.to(".blink-text", {
      opacity: 0,
      repeat: -1,
      yoyo: true,
      duration: 0.8,
    })
  }, [])

  return (
    <section className="py-32 px-4">
      <div className="max-w-4xl mx-auto text-center ready-player">
        <h2 className="font-arcade text-3xl md:text-5xl mb-6 text-arcade-green neon-text glow-heading-green">
          READY PLAYER ONE?
        </h2>
        
        <h3 className="font-arcade text-xl md:text-2xl mb-12 text-arcade-yellow blink-text glow-heading">
          START YOUR TRAINING
        </h3>

        <p className="text-gray-300 mb-12 max-w-2xl mx-auto">
          Join thousands of players who have leveled up their cybersecurity skills through our arcade platform.
        </p>

        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <Link
            href="/assessment"
            className="inline-block font-arcade text-lg px-12 py-6 bg-arcade-magenta text-black rounded-lg hover:bg-opacity-90 transition-colors"
          >
            PRESS START
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
