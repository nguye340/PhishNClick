"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Zap, Trophy, Target, AlertTriangle, Snowflake, Clock, Crosshair, Eye } from 'lucide-react'
import { GameMechanics, PowerUp } from './game-mechanics'

interface GameHUDProps {
  mechanics: GameMechanics
  onPowerUpActivate?: (powerUp: PowerUp) => void
}

export function GameHUD({ mechanics, onPowerUpActivate }: GameHUDProps) {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] pointer-events-none">
      <div className="flex flex-col items-center gap-3 pointer-events-auto">
        {/* Top Bar: Score, Combo, Lives */}
        <div className="flex items-center gap-4 bg-black/80 border-2 border-arcade-cyan rounded-lg px-6 py-3 backdrop-blur-sm">
          {/* Score */}
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-arcade-yellow" />
            <div className="text-center">
              <div className="text-xs font-terminal text-gray-400">SCORE</div>
              <div className="text-2xl font-arcade text-arcade-cyan">{mechanics.score}</div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-12 bg-gray-700" />

          {/* Combo */}
          <div className="flex items-center gap-2">
            <Zap className={`w-5 h-5 ${mechanics.combo > 0 ? 'text-arcade-magenta' : 'text-gray-600'}`} />
            <div className="text-center">
              <div className="text-xs font-terminal text-gray-400">COMBO</div>
              <div className={`text-2xl font-arcade ${mechanics.combo > 0 ? 'text-arcade-magenta' : 'text-gray-600'}`}>
                {mechanics.combo > 0 ? `${mechanics.combo}x` : '-'}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-12 bg-gray-700" />

          {/* Lives */}
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            <div className="text-center">
              <div className="text-xs font-terminal text-gray-400">LIVES</div>
              <div className="flex gap-1">
                {Array.from({ length: mechanics.maxLives }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 1 }}
                    animate={{
                      scale: i < mechanics.lives ? 1 : 0.5,
                      opacity: i < mechanics.lives ? 1 : 0.3,
                    }}
                    className="w-6 h-6"
                  >
                    <Heart
                      className={`w-full h-full ${i < mechanics.lives ? 'text-red-500 fill-red-500' : 'text-gray-600'}`}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-12 bg-gray-700" />

          {/* Difficulty */}
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-arcade-yellow" />
            <div className="text-center">
              <div className="text-xs font-terminal text-gray-400">LEVEL</div>
              <div className="text-2xl font-arcade text-arcade-yellow">{mechanics.difficulty + 1}</div>
            </div>
          </div>
        </div>

        {/* Combo Multiplier Notification */}
        <AnimatePresence>
          {mechanics.combo > 1 && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              className="text-black px-6 py-2 rounded-full font-arcade text-lg shadow-lg"
              style={{
                background: 'linear-gradient(135deg, rgb(255, 0, 255) 0%, rgb(255, 0, 255) 50%, rgb(0, 255, 255) 50%, rgb(0, 255, 255) 100%)'
              }}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                {mechanics.combo}x COMBO!
                <Zap className="w-5 h-5" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Power-Ups Bar */}
        {mechanics.powerUps.length > 0 && (
          <div className="flex items-center gap-2 bg-black/80 border-2 border-arcade-magenta rounded-lg px-4 py-2 backdrop-blur-sm">
            <div className="text-xs font-terminal text-arcade-magenta mr-2">POWER-UPS:</div>
            {mechanics.powerUps.map((powerUp) => (
              <motion.button
                key={powerUp.id}
                onClick={() => onPowerUpActivate?.(powerUp)}
                disabled={powerUp.active}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl
                  ${powerUp.active 
                    ? 'border-gray-600 bg-gray-800 opacity-50 cursor-not-allowed' 
                    : 'border-arcade-magenta bg-black/60 hover:bg-arcade-magenta/20 cursor-pointer'
                  }
                  transition-all duration-200
                `}
                title={`${powerUp.name}: ${powerUp.description}`}
              >
                {powerUp.type === 'freeze' && <Snowflake className="w-6 h-6 text-arcade-cyan" />}
                {powerUp.type === 'slow-mo' && <Clock className="w-6 h-6 text-arcade-magenta" />}
                {powerUp.type === 'auto-report' && <Crosshair className="w-6 h-6 text-arcade-yellow" />}
                {powerUp.type === 'reveal-all' && <Eye className="w-6 h-6 text-arcade-green" />}
                {powerUp.active && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-arcade-cyan rounded-full border-t-transparent animate-spin" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}

        {/* Active Power-Up Indicator */}
        <AnimatePresence>
          {mechanics.activePowerUp && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-white px-6 py-2 rounded-full font-terminal text-sm shadow-lg flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, rgb(147, 51, 234) 0%, rgb(147, 51, 234) 50%, rgb(219, 39, 119) 50%, rgb(219, 39, 119) 100%)'
              }}
            >
              <span className="text-lg">{mechanics.activePowerUp.icon}</span>
              <span>{mechanics.activePowerUp.name} Active!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Score Popup Animation Component
export function ScorePopup({ 
  x, 
  y, 
  value, 
  isCombo 
}: { 
  x: number
  y: number
  value: number
  isCombo?: boolean 
}) {
  return (
    <motion.div
      initial={{ opacity: 1, scale: 1, y: 0 }}
      animate={{ opacity: 0, scale: 1.5, y: -50 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="absolute pointer-events-none z-[200]"
      style={{ left: x, top: y }}
    >
      <div className={`font-arcade text-3xl ${value > 0 ? 'text-green-400' : 'text-red-500'} drop-shadow-lg`}>
        {value > 0 ? '+' : ''}{value}
        {isCombo && <span className="text-arcade-magenta ml-2">COMBO!</span>}
      </div>
    </motion.div>
  )
}

// Badge Notification Component
export function BadgeNotification({ badge }: { badge: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ type: 'spring', damping: 20 }}
      className="fixed top-24 right-4 z-[100] text-black px-6 py-4 rounded-lg shadow-2xl border-2 border-white"
      style={{
        background: 'linear-gradient(135deg, rgb(255, 223, 0) 0%, rgb(255, 223, 0) 50%, rgb(255, 0, 255) 50%, rgb(255, 0, 255) 100%)'
      }}
    >
      <div className="font-arcade text-sm mb-1">NEW BADGE!</div>
      <div className="font-terminal text-lg">{badge}</div>
    </motion.div>
  )
}

// Difficulty Up Notification
export function DifficultyUpNotification({ level }: { level: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: 'spring', damping: 15 }}
      className="fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[200]"
    >
      <div 
        className="text-black px-12 py-8 rounded-2xl shadow-2xl border-4 border-white"
        style={{
          background: 'linear-gradient(135deg, rgb(0, 255, 255) 0%, rgb(0, 255, 255) 33%, rgb(255, 0, 255) 33%, rgb(255, 0, 255) 66%, rgb(255, 223, 0) 66%, rgb(255, 223, 0) 100%)'
        }}
      >
        <div className="font-arcade text-4xl text-center mb-2">LEVEL UP!</div>
        <div className="font-terminal text-2xl text-center">Difficulty: {level}</div>
        <div className="font-terminal text-sm text-center mt-2 opacity-80">Popups are getting trickier!</div>
      </div>
    </motion.div>
  )
}

// Virus Outbreak Hint Popup
export function VirusOutbreakHint({ onClose, onOpenNyantivirus }: { onClose?: () => void; onOpenNyantivirus?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20 }}
      className="fixed inset-0 z-[12000] flex items-center justify-center cursor-pointer"
      onClick={onOpenNyantivirus}
    >
      <div className="bg-gray-900 border-2 border-arcade-cyan rounded-xl shadow-2xl overflow-hidden w-[28rem] max-w-[90vw] hover:scale-[1.02] transition-transform">
        {/* Header */}
        <div className="bg-black/80 p-4 text-center relative">
          {onClose && (
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <span className="text-white text-xl">×</span>
            </button>
          )}
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle className="w-8 h-8 text-arcade-magenta" />
            <h2 className="font-arcade text-3xl text-arcade-cyan tracking-wider">VIRUS OUTBREAK!</h2>
            <AlertTriangle className="w-8 h-8 text-arcade-magenta" />
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 text-center bg-gray-900">
          <p className="text-base text-gray-200 mb-4" style={{ fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
            <strong>The Cattacker has broken in!<br/>Quarantine it before your laptop becomes a litter box!</strong>
          </p>
          
          {/* GIF */}
          <div className="flex justify-center mb-4">
            <img 
              src="/silly-gif/theoffic-staycalm.gif" 
              alt="Stay Calm"
              className="rounded-lg border-2 border-arcade-cyan/40 max-w-full"
              style={{ maxHeight: '180px' }}
            />
          </div>
          
          <p className="text-sm text-gray-300 mb-2" style={{ fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
            Click the <strong className="text-arcade-cyan">Nyantivirus icon</strong> on the taskbar or desktop to start quarantine.
          </p>
          
          <p className="text-xs text-gray-400 italic" style={{ fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
            💡 When in doubt - Opt out!
          </p>
        </div>
      </div>
    </motion.div>
  )
}
