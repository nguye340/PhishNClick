"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardTabs } from "@/components/dashboard/tabs"
import { SkillStats } from "@/components/dashboard/skill-stats"
import { GameRecommendations } from "@/components/dashboard/game-recommendations"
import { useAuth } from "@/context/auth.context"
import Link from "next/link"
import { GraduationCap } from "lucide-react"

export default function DashboardPage() {
  const { auth } = useAuth()
  return (
    <main className="min-h-screen bg-arcade-bg">
      <DashboardHeader />
      <DashboardTabs />
      <div className="max-w-7xl mx-auto py-8 space-y-6">
        {auth?.accessToken && (
          <div className="rounded-lg border border-arcade-magenta/40 bg-black/50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="font-arcade text-arcade-magenta text-lg">Assessment Quiz</h2>
              <p className="font-terminal text-sm text-gray-300">Benchmark your skills now and retake anytime to re-measure progress.</p>
            </div>
            <Link href="/assessment/phishing-test" className="inline-flex items-center gap-2 rounded-md border border-arcade-magenta px-3 py-2 font-terminal text-sm text-arcade-magenta hover:bg-arcade-magenta/10 transition-colors">
              <GraduationCap className="w-4 h-4" /> Start Assessment
            </Link>
          </div>
        )}
        <GameRecommendations />
        <SkillStats />
      </div>
    </main>
  )
}
