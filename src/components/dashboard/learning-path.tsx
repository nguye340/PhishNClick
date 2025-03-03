"use client"

import React from "react"
import { motion } from "framer-motion"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Fish, Sparkles, Trophy } from "lucide-react"

const levels = [
  {
    id: 1,
    title: "Phishing Basics",
    description: "Learn telltale signs of a phishing email",
    status: "completed",
    icon: Fish
  },
  {
    id: 2,
    title: "Email Security",
    description: "Master the art of identifying suspicious emails",
    status: "current",
    icon: Sparkles
  },
  {
    id: 3,
    title: "Advanced Threats",
    description: "Tackle sophisticated phishing techniques",
    status: "locked",
    icon: Trophy
  }
]

export function LearningPath() {
  useGSAP(() => {
    gsap.from(".level-card", {
      opacity: 0,
      y: 30,
      duration: 0.6,
      stagger: 0.2,
      delay: 0.5,
    })
  }, [])

  return (
    <div className="learning-path space-y-12 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-arcade text-2xl text-arcade-green mb-2">
            Section 1: Rookie
          </h1>
          <p className="text-gray-400">
            Master the fundamentals of phishing awareness
          </p>
        </div>

        <div className="text-right">
          <div className="font-arcade text-arcade-yellow text-sm mb-1">
            2023 Year in Review
          </div>
          <button className="text-sm text-arcade-cyan hover:underline">
            SEE YEAR IN REVIEW
          </button>
        </div>
      </div>

      <div className="grid gap-8">
        {levels.map((level, index) => {
          const Icon = level.icon
          return (
            <motion.div
              key={level.id}
              className={`level-card relative p-6 rounded-lg border-2 transition-colors
                ${level.status === "completed" 
                  ? "border-arcade-green bg-arcade-green/10" 
                  : level.status === "current"
                    ? "border-arcade-yellow bg-arcade-yellow/10"
                    : "border-gray-700 bg-gray-900/50"}`}
            >
              {index < levels.length - 1 && (
                <div className={`absolute left-1/2 -bottom-9 w-0.5 h-8
                  ${level.status === "completed" ? "bg-arcade-green" : "bg-gray-700"}`} 
                />
              )}

              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg
                  ${level.status === "completed"
                    ? "bg-arcade-green/20 text-arcade-green"
                    : level.status === "current"
                      ? "bg-arcade-yellow/20 text-arcade-yellow"
                      : "bg-gray-800 text-gray-500"}`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1">
                  <h3 className={`font-arcade text-lg mb-2
                    ${level.status === "completed"
                      ? "text-arcade-green"
                      : level.status === "current"
                        ? "text-arcade-yellow"
                        : "text-gray-500"}`}
                  >
                    Unit {level.id}
                  </h3>
                  <p className={`mb-4
                    ${level.status === "locked" ? "text-gray-500" : "text-gray-300"}`}
                  >
                    {level.description}
                  </p>

                  {level.status === "completed" && (
                    <div className="flex items-center gap-2 text-arcade-green">
                      <div className="w-2 h-2 bg-arcade-green rounded-full" />
                      <span className="text-sm">Completed</span>
                    </div>
                  )}

                  {level.status === "current" && (
                    <button className="font-arcade text-sm px-4 py-2 bg-arcade-yellow text-black rounded hover:bg-opacity-90 transition-colors">
                      CONTINUE
                    </button>
                  )}

                  {level.status === "locked" && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="w-2 h-2 bg-gray-500 rounded-full" />
                      <span className="text-sm">Locked</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="flex justify-center">
        <button className="font-arcade text-sm px-6 py-3 border-2 border-arcade-magenta text-arcade-magenta rounded hover:bg-arcade-magenta hover:text-black transition-colors">
          VIEW ALL SECTIONS
        </button>
      </div>
    </div>
  )
}
