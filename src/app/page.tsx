"use client"

import { LandingHero } from "@/components/landing/hero"
import { GameModes } from "@/components/landing/game-modes"
import { Features } from "@/components/landing/features"
import { ReadyPlayer } from "@/components/landing/ready-player"
import { Footer } from "@/components/layout/footer"
import { SwimmingFish } from "@/components/fish/swimming-fish"

export default function Home() {
  return (
    <main className="relative min-h-screen grid-bg">
      <SwimmingFish />
      <LandingHero />
      <GameModes />
      <Features />
      <ReadyPlayer />
      <Footer />
    </main>
  )
}
