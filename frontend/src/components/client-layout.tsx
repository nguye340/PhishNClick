"use client"

import { SwimmingFish } from "@/components/fish/swimming-fish"

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <>
      <SwimmingFish />
      <div className="scanlines pointer-events-none fixed inset-0 z-50 opacity-10"></div>
      {children}
    </>
  )
}
