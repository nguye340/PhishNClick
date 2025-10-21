"use client"

import { SwimmingFish } from "@/components/fish/swimming-fish"
import { Navbar } from "@/components/layout/navbar"
import { AuthProvider } from "@/context/auth.context"
import { usePathname } from "next/navigation"

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname()
  const isGameRoute = pathname?.startsWith("/games")

  return (
    <AuthProvider>
      <SwimmingFish />
      {!isGameRoute && <Navbar />}
      <div className="scanlines pointer-events-none fixed inset-0 z-50 opacity-10"></div>
      {children}
    </AuthProvider>
  )
}
