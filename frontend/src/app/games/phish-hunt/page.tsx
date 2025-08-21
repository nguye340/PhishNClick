"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { GameOverModal } from '../../../components/modals/game-over-modal'

export default function PhishHuntPage() {
  const router = useRouter()
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [ducksShot, setDucksShot] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Listen for game over events from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      
      if (event.data.type === 'PHISH_HUNT_GAME_OVER') {
        setGameOver(true)
        setScore(event.data.score || 0)
        setLevel(event.data.level || 1)
        setDucksShot(event.data.ducksShot || 0)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const restartGame = () => {
    setGameOver(false)
    setScore(0)
    setLevel(1)
    setDucksShot(0)
    
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
          src="/games/phish-hunt/html/index.html"
          style={{
            width: '100vw',
            height: '100vh',
            border: 'none',
            margin: 0,
            padding: 0,
            overflow: 'hidden',
            backgroundColor: 'black'
          }}
          title="Phish Hunt Game"
          allowFullScreen
          scrolling="no"
          frameBorder="0"
        />
      </div>

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={gameOver}
        currentGame="phish-hunt"
        score={score}
        level={level}
        mistakes={0} // Phish Hunt doesn't use mistake system
        onRestart={restartGame}
        customStats={[
          { label: 'Ducks Shot', value: ducksShot, color: 'text-arcade-green' },
          { label: 'Final Round', value: level, color: 'text-arcade-cyan' }
        ]}
      />
    </>
  )
}
