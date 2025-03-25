"use client"

import React from "react"
import Link from "next/link"
import { Fish, Bell, Settings } from "lucide-react"

export function DashboardHeader() {
  return (
    <header className="border-b border-white/10 bg-arcade-bg/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Fish className="w-8 h-8 text-arcade-cyan" />
          <span className="font-arcade text-arcade-cyan">PHISH N CLICK</span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-arcade-yellow rounded-full animate-pulse" />
            <span className="text-arcade-yellow">713</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-arcade-magenta rounded-full animate-pulse" />
            <span className="text-arcade-magenta">12130</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-arcade-red rounded-full animate-pulse" />
            <span className="text-arcade-red">5</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="hover:text-arcade-cyan transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="hover:text-arcade-cyan transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
