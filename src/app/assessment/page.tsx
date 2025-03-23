"use client"

import AssessmentIntro from "@/components/assessment/intro"
import PhishingTest from "@/components/assessment/phishing-test"
import { FloatingSpeechBubble } from "@/components/ui"
import RiveMainCharacter from "@/components/rive/RiveMainCharacter"

export default function AssessmentPage() {
  return (
    <main className="min-h-screen grid-bg relative">
      {/* Floating speech bubble that renders via portal */}
      <FloatingSpeechBubble text="Welcome to PhishNClick! I'll help you learn how to spot phishing attempts." />
      
      {/* Character on the right side */}
      <RiveMainCharacter />
      
      {/* Main content */}
      <AssessmentIntro />
      <PhishingTest />
    </main>
  )
}
