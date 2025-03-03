"use client"

import React, { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  GraduationCap, 
  Target, 
  Trophy, 
  Users, 
  ShoppingBag,
  User,
  Gamepad2, 
  Brain
} from "lucide-react"

const tabs = [
  {
    id: "learn",
    label: "TRAINING LEVELS",
    icon: Brain,
    description: "Progress through game levels to master phishing awareness skills.",
    href: "/dashboard"
  },
  {
    id: "practice",
    label: "PHISH BLASTER",
    icon: Gamepad2,
    description: "Practice mode with unlimited lives and instant feedback.",
    href: "/dashboard/practice"
  },
  {
    id: "leaderboards",
    label: "SKILL STATS",
    icon: Trophy,
    description: "Track your progress and view detailed battle metrics.",
    href: "/dashboard/leaderboards"
  },
  {
    id: "multiplayer",
    label: "MULTIPLAYER ARENA",
    icon: Users,
    description: "Challenge other players in head-to-head phishing battles.",
    href: "/dashboard/multiplayer"
  },
  {
    id: "shop",
    label: "SHOP",
    icon: ShoppingBag,
    href: "/dashboard/shop"
  },
  {
    id: "profile",
    label: "PROFILE",
    icon: User,
    href: "/dashboard/profile"
  }
]

export function DashboardTabs({ defaultTab = "learn" }: { defaultTab?: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <Link 
            key={tab.id}
            href={tab.href}
            className={`group vhs-button relative p-6 rounded-lg bg-black/50 border border-arcade-cyan hover:bg-arcade-cyan/10 transition-all duration-300
              ${activeTab === tab.id
                ? "border-arcade-cyan text-arcade-cyan"
                : "border-transparent hover:text-arcade-cyan/80"
              }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <Icon className="w-8 h-8 text-arcade-cyan group-hover:text-white transition-colors" />
              <div>
                <h3 className="font-arcade text-lg vhs-aberration mb-2">{tab.label}</h3>
                {tab.description && (
                  <p className="font-terminal text-sm text-gray-400 group-hover:text-gray-300">
                    {tab.description}
                  </p>
                )}
              </div>
            </div>
            <motion.div
              className="absolute inset-0 border-2 border-arcade-cyan rounded-lg"
              initial={false}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </Link>
        )
      })}
    </div>
  )
}
