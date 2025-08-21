"use client"

import React, { useState, useEffect, useRef } from "react"
import { GameOverModal } from "../../modals/game-over-modal"

export default function Phish404Game() {
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lives, setLives] = useState(3)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Listen for game over events from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      
      if (event.data.type === 'PHISH404_GAME_OVER') {
        setGameOver(true)
        setScore(event.data.score || 0)
        setLevel(event.data.level || 1)
        setLives(event.data.lives || 0)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const restartGame = () => {
    setGameOver(false)
    setScore(0)
    setLevel(1)
    setLives(3)
    
    // Reload the iframe to restart the game
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
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
