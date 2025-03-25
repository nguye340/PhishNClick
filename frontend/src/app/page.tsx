"use client"

import { LandingHero } from "@/components/landing/hero"
import { GameModes } from "@/components/landing/game-modes"
import { Features } from "@/components/landing/features"
import { ReadyPlayer } from "@/components/landing/ready-player"
import { Footer } from "@/components/layout/footer"
import Link from "next/link"

export default function Home() {
  return (
    <main className="relative min-h-screen grid-bg">
      {/* Quick navigation link to assessment page */}
      <div className="fixed top-5 right-5 z-50">
        <Link href="/assessment" className="bg-arcade-cyan text-black px-4 py-2 rounded-md font-bold hover:bg-arcade-yellow transition-colors">
          Go to Assessment
        </Link>
      </div>
      
      <LandingHero />
      <GameModes />
      <Features />
      <ReadyPlayer />
      <Footer />
    </main>
  )
}
