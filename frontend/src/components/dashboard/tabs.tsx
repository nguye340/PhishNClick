"use client"

import React, { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Trophy } from "lucide-react"

const tabs = [
  {
    id: "leaderboards",
    label: "SKILL STATS",
    icon: Trophy,
    description: "Track your progress and view detailed battle metrics.",
    href: "/dashboard"
  }
]

export function DashboardTabs({ defaultTab = "leaderboards" }: { defaultTab?: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <div className="grid grid-cols-1 gap-4 p-4">
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
