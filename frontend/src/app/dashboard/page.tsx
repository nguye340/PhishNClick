"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardTabs } from "@/components/dashboard/tabs"
import { LearningPath } from "@/components/dashboard/learning-path"

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-arcade-bg">
      <DashboardHeader />
      <DashboardTabs defaultTab="learn" />
      <div className="max-w-7xl mx-auto py-8">
        <LearningPath />
      </div>
    </main>
  )
}
