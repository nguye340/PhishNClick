"use client"

import { useEffect, useState, useRef } from 'react'
import { GameOverModal } from '../../../components/modals/game-over-modal'

export default function HookedOrCookedPage() {
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [emailsProcessed, setEmailsProcessed] = useState(0)
  const [securityMistakes, setSecurityMistakes] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Listen for game over events from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      
      if (event.data.type === 'HOOKED_OR_COOKED_GAME_OVER') {
        setGameOver(true)
        setScore(event.data.score || 0)
        setLevel(event.data.level || 1)
        setEmailsProcessed(event.data.emailsProcessed || 0)
        setSecurityMistakes(event.data.securityMistakes || 0)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const restartGame = () => {
    setGameOver(false)
    setScore(0)
    setLevel(1)
    setEmailsProcessed(0)
    setSecurityMistakes(0)
    
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
          src="/games/mini_game/mini_game/index.html"
          style={{
            width: '100vw',
            height: '100vh',
            border: 'none',
            margin: 0,
            padding: 0,
            overflow: 'hidden',
            backgroundColor: 'black'
          }}
          title="Hooked or Cooked Game"
          allowFullScreen
          scrolling="no"
          frameBorder="0"
        />
      </div>

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={gameOver}
        currentGame="hooked-or-cooked"
        score={score}
        level={level}
        mistakes={securityMistakes}
        onRestart={restartGame}
        customStats={[
          { label: 'Emails Processed', value: emailsProcessed, color: 'text-arcade-cyan' },
          { label: 'Security Mistakes', value: securityMistakes, color: 'text-arcade-red' }
        ]}
      />
    </>
  )
}
