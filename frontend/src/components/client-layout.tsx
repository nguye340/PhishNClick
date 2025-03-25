"use client"

import { useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { CursorProvider } from "@/components/cursor/cursor-provider"
import { SwimmingFish } from "@/components/fish/swimming-fish"

interface ClientLayoutProps {
  children: React.ReactNode
  inter: any
  pressStart2P: any
  vt323: any
  silkscreen: any
}

export function ClientLayout({ children, inter, pressStart2P, vt323, silkscreen }: ClientLayoutProps) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
  }, [])

  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${pressStart2P.variable} ${vt323.variable} ${silkscreen.variable} font-sans bg-arcade-bg text-foreground antialiased`}>
        <CursorProvider>
          <div className="relative min-h-screen">
            <SwimmingFish />
            <div className="scanlines pointer-events-none fixed inset-0 z-50 opacity-10"></div>
            {children}
          </div>
        </CursorProvider>
      </body>
    </html>
  )
}
