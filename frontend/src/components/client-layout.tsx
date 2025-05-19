"use client"

import { useEffect } from "react"
import { CursorProvider } from "@/components/cursor/cursor-provider"
import { SwimmingFish } from "@/components/fish/swimming-fish"
import "@/styles/optimized-cursor.css"

// Dynamically import GSAP to prevent chunk loading errors
let gsap: any;
let ScrollTrigger: any;

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  useEffect(() => {
    // Dynamically import GSAP only on the client side
    const loadGsap = async () => {
      try {
        gsap = (await import('gsap')).default;
        ScrollTrigger = (await import('gsap/ScrollTrigger')).ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);
      } catch (error) {
        console.error('Failed to load GSAP:', error);
      }
    };
    
    loadGsap();
  }, [])

  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-arcade-bg text-foreground antialiased">
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
