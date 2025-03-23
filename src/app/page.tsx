"use client"

import { LandingHero } from "@/components/landing/hero"
import { GameModes } from "@/components/landing/game-modes"
import { Features } from "@/components/landing/features"
import { ReadyPlayer } from "@/components/landing/ready-player"
import { Footer } from "@/components/layout/footer"

export default function Home() {
  return (
    <main className="relative min-h-screen grid-bg">
      <LandingHero />
      <GameModes />
      <Features />
      <ReadyPlayer />
      <Footer />
    </main>
  )
}
