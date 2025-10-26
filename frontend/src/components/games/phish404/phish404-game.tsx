"use client"

import React, { useState, useEffect, useRef } from "react"
import { GameOverModal } from "../../modals/game-over-modal"
import { logEvent } from "@/lib/telemetry"

const INITIAL_LIVES = 6

export default function Phish404Game() {
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lives, setLives] = useState(3)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Listen for game over events from the iframe
  useEffect(() => {
    try { logEvent({ type: "game_started", game: "Phish404", ts: Date.now() }) } catch {}

    const handleMessage = (event: MessageEvent) => {
      // Accept messages from same origin or from the iframe
      // Skip origin check since iframe is served from same domain
      
      if (event.data.type === 'PHISH404_INTERACTION') {
        const {
          outcome,
          category,
          ui_type,
          action,
          reaction_ms,
          difficulty,
          voice_call_type,
          ts,
        } = event.data

        const timestamp = typeof ts === 'number' ? ts : Date.now()

        if (outcome === 'correct') {
          try {
            logEvent({
              type: 'popup_correct',
              game: 'Phish404',
              category,
              ui_type,
              reaction_ms,
              difficulty,
              voice_call_type,
              ts: timestamp,
            })
          } catch {}
        } else if (outcome === 'incorrect') {
          try {
            logEvent({
              type: 'popup_incorrect',
              game: 'Phish404',
              category,
              ui_type,
              action,
              reaction_ms,
              difficulty,
              voice_call_type,
              ts: timestamp,
            })
          } catch {}
        }
        return
      }

      if (event.data.type === 'PHISH404_GAME_OVER') {
        setGameOver(true)
        setScore(event.data.score || 0)
        setLevel(event.data.level || 1)
        setLives(event.data.lives || 0)

        const remainingLives = typeof event.data.lives === 'number' ? event.data.lives : 0
        const mistakes = Math.max(0, INITIAL_LIVES - remainingLives)
        try {
          logEvent({
            type: "game_over",
            game: "Phish404",
            score: event.data.score || 0,
            level: event.data.level || 1,
            mistakes,
            ts: Date.now()
          })
        } catch {}
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const restartGame = () => {
    setGameOver(false)
    setScore(0)
    setLevel(1)
    setLives(INITIAL_LIVES)
    
    // Reload the iframe to restart the game
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }

    try { logEvent({ type: "game_started", game: "Phish404", ts: Date.now() }) } catch {}
  }

  return (
    <>
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center p-0 overflow-hidden">
        <iframe
          ref={iframeRef}
          src="/games/phish404/index.html"
          style={{
            width: '100vw',
            height: '100vh',
            border: 'none',
            margin: 0,
            padding: 0,
            overflow: 'hidden',
            backgroundColor: 'black'
          }}
          title="Phish404 Game"
          allowFullScreen
          scrolling="no"
          frameBorder="0"
        />
      </div>

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={gameOver}
        currentGame="phish404"
        score={score}
        level={level}
        mistakes={0} // Phish404 doesn't use mistake system
        onRestart={restartGame}
        customStats={[
          { label: 'Lives Lost', value: 3 - lives, color: 'text-arcade-red' },
          { label: 'Final Level', value: level, color: 'text-arcade-cyan' }
        ]}
      />
    </>
  )
}
