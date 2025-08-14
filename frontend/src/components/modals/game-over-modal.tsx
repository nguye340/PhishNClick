"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  getNextGame, 
  isFinalGame, 
  markGameCompleted, 
  GAME_NAMES, 
  GAME_ROUTES 
} from '../../utils/game-progression'

interface GameOverModalProps {
  isOpen: boolean
  currentGame: string
  score?: number
  level?: number
  mistakes?: number
  onRestart: () => void
  onClose?: () => void
  customStats?: Array<{
    label: string
    value: string | number
    color?: string
  }>
}

export function GameOverModal({ 
  isOpen, 
  currentGame, 
  score = 0, 
  level = 1, 
  mistakes = 0,
  onRestart,
  onClose,
  customStats = []
}: GameOverModalProps) {
  const router = useRouter()
  const nextGame = getNextGame(currentGame)
  const isLastGame = isFinalGame(currentGame)

  const handleNextGame = () => {
    if (nextGame) {
      // Mark current game as completed
      markGameCompleted(currentGame)
      
      // Navigate to next game
      router.push(GAME_ROUTES[nextGame as keyof typeof GAME_ROUTES])
    } else if (isLastGame) {
      // Show final assessment quiz
      markGameCompleted(currentGame)
      router.push('/assessment/final-quiz')
    }
  }

  const handleBackToMenu = () => {
    router.push('/')
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-gray-900 border-2 border-red-500 rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="text-6xl mb-4"
            >
              💥
            </motion.div>
            <h2 className="text-4xl font-arcade text-red-400 mb-2 glow-heading">
              SYSTEM CRASHED
            </h2>
            <p className="text-xl font-terminal text-gray-300">
              Game Over - Too many security mistakes!
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700">
              <div className="text-2xl font-arcade text-arcade-cyan">{score}</div>
              <div className="text-sm font-terminal text-gray-400">Score</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700">
              <div className="text-2xl font-arcade text-arcade-green">{level}</div>
              <div className="text-sm font-terminal text-gray-400">Level</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700">
              <div className="text-2xl font-arcade text-red-400">{mistakes}</div>
              <div className="text-sm font-terminal text-gray-400">Mistakes</div>
            </div>
            
            {/* Custom Stats */}
            {customStats.map((stat, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700">
                <div className={`text-2xl font-arcade ${stat.color || 'text-arcade-magenta'}`}>
                  {stat.value}
                </div>
                <div className="text-sm font-terminal text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Restart Game */}
            <motion.button
              onClick={onRestart}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full bg-arcade-green text-black font-arcade text-lg py-4 px-6 rounded-lg hover:bg-green-400 transition-colors border-2 border-arcade-green"
            >
              🔄 Try Again
            </motion.button>

            {/* Next Game or Final Quiz */}
            {nextGame && (
              <motion.button
                onClick={handleNextGame}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full bg-arcade-cyan text-black font-arcade text-lg py-4 px-6 rounded-lg hover:bg-cyan-400 transition-colors border-2 border-arcade-cyan"
              >
                ➡️ Continue to {GAME_NAMES[nextGame as keyof typeof GAME_NAMES]}
              </motion.button>
            )}

            {isLastGame && (
              <motion.button
                onClick={handleNextGame}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full bg-arcade-magenta text-black font-arcade text-lg py-4 px-6 rounded-lg hover:bg-pink-400 transition-colors border-2 border-arcade-magenta"
              >
                🎓 Take Final Assessment Quiz
              </motion.button>
            )}

            {/* Back to Menu */}
            <motion.button
              onClick={handleBackToMenu}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full bg-gray-700 text-white font-arcade text-lg py-4 px-6 rounded-lg hover:bg-gray-600 transition-colors border-2 border-gray-600"
            >
              🏠 Back to Main Menu
            </motion.button>
          </div>

          {/* Progress Indicator */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="text-center text-sm font-terminal text-gray-400 mb-2">
              Game Progression
            </div>
            <div className="flex justify-center space-x-2">
              {['popup-manic', 'phish404', 'phish-hunt', 'hooked-or-cooked'].map((game, index) => (
                <div
                  key={game}
                  className={`w-3 h-3 rounded-full ${
                    game === currentGame 
                      ? 'bg-red-400' 
                      : index < ['popup-manic', 'phish404', 'phish-hunt', 'hooked-or-cooked'].indexOf(currentGame)
                        ? 'bg-arcade-green'
                        : 'bg-gray-600'
                  }`}
                />
              ))}
              <div className="w-3 h-3 rounded-full bg-arcade-magenta opacity-50" title="Final Quiz" />
            </div>
            <div className="text-xs font-terminal text-gray-500 text-center mt-1">
              Complete all 4 games to unlock the final assessment
            </div>
          </div>

          {/* Close button if provided */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
