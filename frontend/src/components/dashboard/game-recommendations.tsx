"use client"

import React from "react"
import Link from "next/link"
import { useTelemetryMetrics } from "@/lib/telemetry"
import { Gamepad2, ArrowRight, ThumbsUp, AlertTriangle } from "lucide-react"

const GAME_ROUTES: Record<string, string> = {
  "popup manic": "/games/popup-manic",
  "phish hunt": "/games/phish-hunt",
  "phish404": "/games/phish404",
  "phish 404": "/games/phish404",
  "hooked or cooked": "/games/hooked-or-cooked",
}

const KNOWN_GAMES: Array<{ name: string; route: string }> = [
  { name: "Popup Manic", route: "/games/popup-manic" },
  { name: "Phish Hunt", route: "/games/phish-hunt" },
  { name: "Phish404", route: "/games/phish404" },
  { name: "Hooked or Cooked", route: "/games/hooked-or-cooked" },
]

function toRoute(name: string) {
  const k = name.trim().toLowerCase()
  if (GAME_ROUTES[k]) return GAME_ROUTES[k]
  const keys = Object.keys(GAME_ROUTES)
  const hit = keys.find((key) => k.includes(key) || key.includes(k))
  return hit ? GAME_ROUTES[hit] : "/games/popup-manic"
}

export function GameRecommendations() {
  const metrics = useTelemetryMetrics()

  // Build game stats list from telemetry
  const gamesFromTelemetry = Object.keys(metrics.byGame).map((name) => {
    const g = metrics.byGame[name]
    const attempts = g.correct + g.incorrect
    const accuracy = g.accuracy || 0
    const route = toRoute(name)
    return { name, attempts, accuracy, route, sessions: g.sessions }
  })

  // Identify played vs not played based on telemetry and known games
  const playedNames = new Set(gamesFromTelemetry.map((g) => g.name.toLowerCase()))
  const notPlayed = KNOWN_GAMES.filter((kg) => !playedNames.has(kg.name.toLowerCase()))
  const played = gamesFromTelemetry
    .slice()
    .sort((a, b) => (b.attempts - a.attempts) || (b.sessions - a.sessions))

  // Classify skill buckets
  const GOOD_AT = played.filter((g) => g.attempts >= 3 && g.accuracy >= 0.8)
  const NEEDS_HELP = played.filter((g) => g.attempts >= 3 && g.accuracy < 0.6)

  // Pick recommended next
  let recommended = null as null | { name: string; route: string; reason: string }
  if (NEEDS_HELP.length) {
    const worst = [...NEEDS_HELP].sort((a, b) => a.accuracy - b.accuracy)[0]
    recommended = { name: worst.name, route: worst.route, reason: "Target weak area" }
  } else if (notPlayed.length) {
    recommended = { name: notPlayed[0].name, route: notPlayed[0].route, reason: "Try a new game" }
  } else if (played.length) {
    const leastTried = [...played].sort((a, b) => a.attempts - b.attempts)[0]
    recommended = { name: leastTried.name, route: leastTried.route, reason: "Build more reps" }
  }

  return (
    <section className="rounded-lg border border-arcade-cyan/40 bg-black/50 p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-arcade text-arcade-cyan text-lg">Game Recommendations</h2>
        {recommended && (
          <Link href={recommended.route} className="inline-flex items-center gap-2 rounded-md border border-arcade-cyan px-3 py-2 font-terminal text-sm text-arcade-cyan hover:bg-arcade-cyan/10 transition-colors">
            <Gamepad2 className="w-4 h-4" /> Play {recommended.name}
          </Link>
        )}
      </div>

      {/* Recommended Reason */}
      {recommended && (
        <div className="text-xs font-terminal text-gray-400">Reason: {recommended.reason}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Played */}
        <div className="rounded-md border border-white/10 bg-black/40 p-3">
          <div className="flex items-center gap-2 mb-2">
            <ThumbsUp className="w-4 h-4 text-arcade-green" />
            <h3 className="font-arcade text-white text-base">Games You Played</h3>
          </div>
          {played.length === 0 ? (
            <div className="text-sm font-terminal text-gray-400">No gameplay yet. Press "Insert Coin" to start!</div>
          ) : (
            <ul className="space-y-1">
              {played.map((g) => (
                <li key={g.name} className="flex items-center justify-between text-sm font-terminal text-gray-300">
                  <span>{g.name}</span>
                  <span className="text-xs text-gray-500">{Math.round(g.accuracy * 100)}% • {g.attempts} attempts</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Not Played */}
        <div className="rounded-md border border-white/10 bg-black/40 p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-arcade-yellow" />
            <h3 className="font-arcade text-white text-base">Games You Haven't Tried</h3>
          </div>
          {notPlayed.length === 0 ? (
            <div className="text-sm font-terminal text-gray-400">You've tried all available games. Nice!</div>
          ) : (
            <ul className="space-y-1">
              {notPlayed.map((g) => (
                <li key={g.name} className="flex items-center justify-between text-sm font-terminal text-gray-300">
                  <span>{g.name}</span>
                  <Link href={g.route} className="text-arcade-cyan text-xs inline-flex items-center gap-1 hover:underline">
                    Play <ArrowRight className="w-3 h-3" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Good At */}
        <div className="rounded-md border border-arcade-green/40 bg-black/40 p-3">
          <h3 className="font-arcade text-arcade-green text-base mb-2">Good At</h3>
          {GOOD_AT.length === 0 ? (
            <div className="text-sm font-terminal text-gray-400">We will highlight strengths as you play.</div>
          ) : (
            <ul className="space-y-1">
              {GOOD_AT.map((g) => (
                <li key={g.name} className="flex items-center justify-between text-sm font-terminal text-gray-300">
                  <span>{g.name}</span>
                  <span className="text-xs text-gray-500">{Math.round(g.accuracy * 100)}% • {g.attempts} attempts</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Needs Improvement */}
        <div className="rounded-md border border-arcade-red/40 bg-black/40 p-3">
          <h3 className="font-arcade text-arcade-red text-base mb-2">Needs Improvement</h3>
          {NEEDS_HELP.length === 0 ? (
            <div className="text-sm font-terminal text-gray-400">We'll suggest focus areas once you have enough attempts.</div>
          ) : (
            <ul className="space-y-1">
              {NEEDS_HELP.map((g) => (
                <li key={g.name} className="flex items-center justify-between text-sm font-terminal text-gray-300">
                  <span>{g.name}</span>
                  <span className="text-xs text-gray-500">{Math.round(g.accuracy * 100)}% • {g.attempts} attempts</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
