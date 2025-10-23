"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Target, Zap, Clock, Award, TrendingUp, X, Crown, Star, Gem, Sparkles, Sprout, Gamepad2 } from 'lucide-react'

interface GameSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  onPlayAgain: () => void
  onNextGame?: () => void
  onBackToHome?: () => void
  summary: {
    finalScore: number
    accuracy: number
    averageReactionTime: number
    correctAnswers: number
    totalAnswers: number
    highestCombo: number
    badges: string[]
    difficulty: number
  }
}

export function GameSummaryModal({
  isOpen,
  onClose,
  onPlayAgain,
  onNextGame,
  onBackToHome,
  summary,
}: GameSummaryModalProps) {
  if (!isOpen) return null

  const getRankFromScore = (score: number): { rank: string; color: string; IconComponent: React.ComponentType<{ className?: string }> } => {
    if (score >= 1000) return { rank: 'Master', color: 'text-yellow-400', IconComponent: Crown }
    if (score >= 750) return { rank: 'Expert', color: 'text-purple-400', IconComponent: Star }
    if (score >= 500) return { rank: 'Advanced', color: 'text-blue-400', IconComponent: Gem }
    if (score >= 250) return { rank: 'Intermediate', color: 'text-green-400', IconComponent: Sparkles }
    return { rank: 'Beginner', color: 'text-black', IconComponent: Sprout }
  }

  const rank = getRankFromScore(summary.finalScore)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 20 }}
          className="relative max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Main Card */}
          <div className="bg-gradient-to-br from-black via-gray-900 to-black border-4 border-arcade-cyan rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div 
              className="relative p-8 text-center"
              style={{
                background: 'linear-gradient(135deg, rgb(0, 255, 255) 0%, rgb(0, 255, 255) 50%, rgb(255, 0, 255) 50%, rgb(255, 0, 255) 100%)'
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="mb-4 flex justify-center"
              >
                <rank.IconComponent className="w-24 h-24 text-white" />
              </motion.div>
              
              <h2 className="font-arcade text-4xl text-white mb-2">GAME COMPLETE!</h2>
              <p className={`font-terminal text-2xl ${rank.color}`}>{rank.rank} Rank</p>
            </div>

            {/* Score Section */}
            <div className="p-8 border-b-2 border-gray-800">
              <div className="text-center mb-6">
                <div className="font-terminal text-sm text-gray-400 mb-2">FINAL SCORE</div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="font-arcade text-6xl text-arcade-cyan"
                >
                  {summary.finalScore}
                </motion.div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Accuracy */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-black/60 border border-arcade-cyan/40 rounded-lg p-4 text-center"
                >
                  <Target className="w-8 h-8 text-arcade-cyan mx-auto mb-2" />
                  <div className="font-terminal text-xs text-gray-400 mb-1">ACCURACY</div>
                  <div className="font-arcade text-2xl text-arcade-cyan">{summary.accuracy.toFixed(1)}%</div>
                </motion.div>

                {/* Correct Answers */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-black/60 border border-green-500/40 rounded-lg p-4 text-center"
                >
                  <Trophy className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="font-terminal text-xs text-gray-400 mb-1">CORRECT</div>
                  <div className="font-arcade text-2xl text-green-500">
                    {summary.correctAnswers}/{summary.totalAnswers}
                  </div>
                </motion.div>

                {/* Highest Combo */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-black/60 border border-arcade-magenta/40 rounded-lg p-4 text-center"
                >
                  <Zap className="w-8 h-8 text-arcade-magenta mx-auto mb-2" />
                  <div className="font-terminal text-xs text-gray-400 mb-1">MAX COMBO</div>
                  <div className="font-arcade text-2xl text-arcade-magenta">{summary.highestCombo}x</div>
                </motion.div>

                {/* Avg Reaction Time */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-black/60 border border-arcade-yellow/40 rounded-lg p-4 text-center"
                >
                  <Clock className="w-8 h-8 text-arcade-yellow mx-auto mb-2" />
                  <div className="font-terminal text-xs text-gray-400 mb-1">AVG TIME</div>
                  <div className="font-arcade text-2xl text-arcade-yellow">
                    {(summary.averageReactionTime / 1000).toFixed(1)}s
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Difficulty Level */}
            <div className="p-6 border-b-2 border-gray-800">
              <div className="flex items-center justify-center gap-4">
                <TrendingUp className="w-6 h-6 text-arcade-cyan" />
                <div>
                  <div className="font-terminal text-sm text-gray-400">Difficulty Reached</div>
                  <div className="font-arcade text-xl text-white">Level {summary.difficulty + 1}</div>
                </div>
              </div>
            </div>

            {/* Badges */}
            {summary.badges.length > 0 && (
              <div className="p-6 border-b-2 border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-6 h-6 text-arcade-yellow" />
                  <h3 className="font-arcade text-xl text-white">BADGES EARNED</h3>
                </div>
                <div className="space-y-2">
                  {summary.badges.map((badge, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="border border-arcade-yellow/40 rounded-lg px-4 py-3 font-terminal text-sm text-white"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 223, 0, 0.2) 0%, rgba(255, 223, 0, 0.2) 50%, rgba(255, 0, 255, 0.2) 50%, rgba(255, 0, 255, 0.2) 100%)'
                      }}
                    >
                      {badge}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Tips */}
            <div className="p-6 bg-black/40">
              <h3 className="font-arcade text-lg text-arcade-cyan mb-3">PERFORMANCE TIPS</h3>
              <div className="space-y-2 font-terminal text-sm text-gray-300">
                {summary.accuracy < 80 && (
                  <div className="flex items-start gap-2">
                    <span className="text-arcade-magenta">•</span>
                    <span>Take more time to read popup content carefully before acting</span>
                  </div>
                )}
                {summary.averageReactionTime > 5000 && (
                  <div className="flex items-start gap-2">
                    <span className="text-arcade-magenta">•</span>
                    <span>Try to identify threats faster - look for red flags quickly</span>
                  </div>
                )}
                {summary.highestCombo < 3 && (
                  <div className="flex items-start gap-2">
                    <span className="text-arcade-magenta">•</span>
                    <span>Build combos by answering correctly in quick succession</span>
                  </div>
                )}
                {summary.difficulty < 2 && (
                  <div className="flex items-start gap-2">
                    <span className="text-arcade-magenta">•</span>
                    <span>Keep improving to unlock higher difficulty levels</span>
                  </div>
                )}
                {summary.accuracy >= 95 && summary.highestCombo >= 5 && (
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span className="text-green-400">Excellent performance! You're a cybersecurity expert!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 flex flex-col gap-3">
              <button
                onClick={onPlayAgain}
                className="w-full text-white font-arcade text-lg py-4 rounded-lg hover:opacity-90 transition-opacity"
                style={{
                  background: 'linear-gradient(135deg, rgb(0, 255, 255) 0%, rgb(0, 255, 255) 50%, rgb(255, 0, 255) 50%, rgb(255, 0, 255) 100%)'
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <Gamepad2 className="w-6 h-6" />
                  PLAY AGAIN
                </div>
              </button>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {onNextGame && (
                  <button
                    onClick={onNextGame}
                    className="flex-1 bg-arcade-cyan text-black font-arcade text-base py-3 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    NEXT GAME
                  </button>
                )}
                {onBackToHome && (
                  <button
                    onClick={onBackToHome}
                    className="flex-1 bg-gray-800 text-white font-terminal text-base py-3 rounded-lg hover:bg-gray-700 transition-colors border-2 border-gray-600"
                  >
                    BACK TO HOMEPAGE
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
