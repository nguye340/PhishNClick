"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Bell, Settings } from "lucide-react"

// Define styles for consistent application
const arcadeFontStyle = {
  fontFamily: "'Press Start 2P', cursive"
}

const terminalFontStyle = {
  fontFamily: "'VT323', monospace"
}

const iconStyle = {
  width: "2rem",
  height: "2rem",
  color: "#00ffff"
}

const textStyle = {
  fontSize: "1.5rem",
  fontWeight: "bold"
}

const notificationStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem"
}

const notificationDotStyle = {
  width: "0.5rem",
  height: "0.5rem",
  borderRadius: "50%",
  animation: "pulse 2s infinite"
}

const buttonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "2rem",
  height: "2rem",
  borderRadius: "50%",
  transition: "color 0.2s ease-in-out",
  cursor: "pointer"
}

export function DashboardHeader() {
  return (
    <header className="border-b border-white/10 bg-arcade-bg/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 relative">
            <Image 
              src="/img/catphish_white_centered.svg" 
              alt="Phish" 
              fill 
              className="text-arcade-cyan"
              style={{ filter: "brightness(1.2) hue-rotate(180deg)" }}
            />
          </div>
          <span style={{...arcadeFontStyle, ...textStyle}} className="text-arcade-cyan">PHISH N CLICK</span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-arcade-yellow rounded-full animate-pulse" />
            <span style={terminalFontStyle} className="text-arcade-yellow">713</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-arcade-magenta rounded-full animate-pulse" />
            <span style={terminalFontStyle} className="text-arcade-magenta">12130</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-arcade-red rounded-full animate-pulse" />
            <span style={terminalFontStyle} className="text-arcade-red">5</span>
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
