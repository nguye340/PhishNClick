"use client"

import React from "react"
import { useTelemetryMetrics, clearEvents, getAllEvents } from "@/lib/telemetry"
import { motion } from "framer-motion"
import { BarChart3, Gauge, TimerReset, Target, Trash2 } from "lucide-react"

function StatCard({ title, value, sub }: { title: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-4">
      <div className="text-xs font-terminal text-gray-400 mb-1">{title}</div>
      <div className="text-2xl font-arcade text-arcade-cyan">{value}</div>
      {sub && <div className="text-xs font-terminal text-gray-500 mt-1">{sub}</div>}
    </div>
  )
}

export function SkillStats() {
  const metrics = useTelemetryMetrics()

  const accuracyPct = Math.round((metrics.overall.accuracy || 0) * 100)
  const overallCards = [
    { title: "Sessions", value: metrics.overall.sessions },
    { title: "Interactions", value: metrics.overall.interactions },
    { title: "Accuracy", value: `${accuracyPct}%` },
    { title: "Avg Reaction", value: metrics.overall.avgReactionMs != null ? `${metrics.overall.avgReactionMs} ms` : "-" },
  ]

  const sortedGames = Object.keys(metrics.byGame).sort()
  const recommendations = metrics.recommendations

  return (
    <div className="space-y-8">
      {/* Overview */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-arcade-cyan" />
          <h2 className="font-arcade text-arcade-cyan text-xl">Overall Progress</h2>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => {
                clearEvents()
                // force rerender by reading events
                getAllEvents()
                window.dispatchEvent(new StorageEvent("storage", { key: "phishnclick.telemetry.v1" }))
              }}
              className="text-xs px-2 py-1 rounded border border-arcade-magenta/50 text-arcade-magenta hover:bg-arcade-magenta/10 transition-colors flex items-center gap-1"
              title="Clear local progress data"
            >
              <Trash2 className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {overallCards.map((c) => (
            <StatCard key={c.title} title={c.title} value={c.value} />
          ))}
        </div>
      </section>

      {/* Per Game */}
      {sortedGames.map((game) => {
        const g = metrics.byGame[game]
        const gAccuracy = Math.round((g.accuracy || 0) * 100)
        const categories = Object.keys(g.byCategory)
          .map((k) => ({ key: k, ...g.byCategory[k] }))
          .sort((a, b) => (a.accuracy - b.accuracy))

        const recentQuizzes = [...g.quizzes].sort((a, b) => b.ts - a.ts).slice(0, 5)

        return (
          <section key={game} className="rounded-lg border border-white/10 bg-black/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gauge className="w-5 h-5 text-arcade-yellow" />
              <h3 className="font-arcade text-lg text-white">{game}</h3>
              <div className="ml-auto text-xs font-terminal text-gray-400">
                {g.sessions} sessions • {g.interactions} interactions • {gAccuracy}% accuracy
              </div>
            </div>

            {/* Game summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <StatCard title="Correct" value={g.correct} />
              <StatCard title="Incorrect" value={g.incorrect} />
              <StatCard title="Accuracy" value={`${gAccuracy}%`} />
              <StatCard title="Avg Reaction" value={g.avgReactionMs != null ? `${g.avgReactionMs} ms` : "-"} />
            </div>

            {/* Category breakdown */}
            {categories.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-terminal text-gray-400 mb-2">Categories</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {categories.map((c) => {
                    const pct = Math.round((c.accuracy || 0) * 100)
                    return (
                      <div key={`${game}-${c.key}`} className="rounded-md border border-white/10 p-3 bg-black/40">
                        <div className="flex items-center justify-between">
                          <div className="font-terminal text-sm text-white">{c.key}</div>
                          <div className={`font-terminal text-xs ${pct < 60 ? 'text-arcade-red' : pct < 80 ? 'text-arcade-yellow' : 'text-arcade-green'}`}>{pct}%</div>
                        </div>
                        <div className="text-xs font-terminal text-gray-400 mt-1">
                          {c.correct} correct / {c.incorrect} incorrect
                        </div>
                        <div className="h-1.5 bg-gray-700 mt-2 rounded">
                          <div className="h-full bg-arcade-cyan rounded" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recent quizzes */}
            {recentQuizzes.length > 0 && (
              <div>
                <div className="text-xs font-terminal text-gray-400 mb-2">Recent Quizzes</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {recentQuizzes.map((q, i) => (
                    <motion.div key={i} className="rounded-md border border-white/10 p-3 bg-black/40 flex items-center justify-between">
                      <div className="font-terminal text-sm text-white">{new Date(q.ts).toLocaleString()}</div>
                      <div className="font-arcade text-lg text-arcade-cyan">{q.percentage}%</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )
      })}

      {/* Recommendations */}
      <section className="rounded-lg border border-white/10 bg-black/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-arcade-magenta" />
          <h3 className="font-arcade text-lg text-white">Recommended Next Steps</h3>
        </div>
        {recommendations.length === 0 ? (
          <div className="text-sm font-terminal text-gray-400">
            Keep playing! Recommendations will appear once we see patterns in your mistakes.
          </div>
        ) : (
          <ul className="list-disc pl-5 space-y-2">
            {recommendations.map((r, idx) => (
              <li key={idx} className="font-terminal text-sm text-gray-200">{r}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
