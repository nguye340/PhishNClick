"use client"

import AssessmentIntro from "@/components/assessment/intro"
import PhishingTest from "@/components/assessment/phishing-test"

export default function AssessmentPage() {
  return (
    <main className="min-h-screen grid-bg relative">
      {/* Main content */}
      <AssessmentIntro />
      <PhishingTest />
    </main>
  )
}
