"use client"

import React from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Trophy, Users, BarChart3, Gamepad2 } from "lucide-react"

export function Features() {
  useGSAP(() => {
    gsap.from(".feature-card", {
      opacity: 0,
      y: 30,
      duration: 0.6,
      stagger: 0.2,
      scrollTrigger: {
        trigger: ".features-grid",
        start: "top center+=100",
      },
    })
  }, [])

  return (
    <section className="py-24 px-4 bg-arcade-bg/50">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-arcade text-2xl md:text-4xl text-center mb-16 text-arcade-yellow neon-text glow-heading">
          GAME FEATURES
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 features-grid">
          <FeatureCard
            icon={<Trophy className="w-8 h-8" />}
            title="TRAINING LEVELS"
            description="Progress through increasingly difficult security challenges. Unlock new levels as you improve your skills."
            color="green"
          />

          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="MULTIPLAYER"
            description="Challenge friends and colleagues in head-to-head security battles. Team up to defeat advanced phishing threats."
            color="magenta"
          />

          <FeatureCard
            icon={<BarChart3 className="w-8 h-8" />}
            title="SKILL STATS"
            description="Track your progress with detailed performance metrics. Identify your strengths and areas for improvement."
            color="yellow"
          />

          <FeatureCard
            icon={<Gamepad2 className="w-8 h-8" />}
            title="HIGH SCORES"
            description="Compete for the top spot on global, regional, or company leaderboards. Show off your security expertise!"
            color="cyan"
          />
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ icon, title, description, color }: {
  icon: React.ReactNode
  title: string
  description: string
  color: "green" | "magenta" | "yellow" | "cyan"
}) {
  const colorClasses = {
    green: "text-arcade-green border-arcade-green",
    magenta: "text-arcade-magenta border-arcade-magenta",
    yellow: "text-arcade-yellow border-arcade-yellow",
    cyan: "text-arcade-cyan border-arcade-cyan",
  }

  const glowClasses = {
    green: "glow-heading-green",
    magenta: "glow-heading-pink",
    yellow: "glow-heading",
    cyan: "glow-heading",
  }

  return (
    <div className={`feature-card p-6 border-2 rounded-lg bg-arcade-bg/30 backdrop-blur-sm ${colorClasses[color]}`}>
      <div className="mb-4">
        {icon}
      </div>
      <h3 className={`font-arcade text-lg mb-3 ${glowClasses[color]}`}>
        {title}
      </h3>
      <p className="text-gray-300 text-sm">
        {description}
      </p>
    </div>
  )
}
