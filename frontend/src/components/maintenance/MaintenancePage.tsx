"use client"

import React from 'react'
import { AlertTriangle, RefreshCw, Server } from 'lucide-react'
import { motion } from 'framer-motion'

export default function MaintenancePage() {
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-arcade-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-black/60 border border-arcade-yellow/40 rounded-lg p-8 text-center">
          {/* Icon */}
          <motion.div
            animate={{ 
              rotate: [0, -5, 5, -5, 5, 0],
            }}
            transition={{ 
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: 2
            }}
            className="inline-block mb-6"
          >
            <div className="w-24 h-24 mx-auto bg-arcade-yellow/20 rounded-full flex items-center justify-center border-4 border-arcade-yellow">
              <Server className="w-12 h-12 text-arcade-yellow" />
            </div>
          </motion.div>

          {/* Title */}
          <h1 className="font-arcade text-3xl text-arcade-yellow mb-4">
            System Maintenance
          </h1>

          {/* Message */}
          <div className="space-y-4 mb-8">
            <p className="font-terminal text-gray-300 text-lg">
              Our servers are currently undergoing maintenance or experiencing temporary issues.
            </p>
            <p className="font-terminal text-gray-400 text-sm">
              We're working hard to get everything back online. Please try again in a few moments.
            </p>
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-black/40 border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                <span className="font-terminal text-sm text-gray-400">Backend Status</span>
              </div>
              <p className="font-arcade text-red-500 text-xs">Unavailable</p>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="font-terminal text-sm text-gray-400">Frontend Status</span>
              </div>
              <p className="font-arcade text-green-500 text-xs">Online</p>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-6 py-3 bg-arcade-cyan text-black font-terminal rounded-lg hover:bg-arcade-cyan/90 transition-all transform hover:-translate-y-1 active:translate-y-0"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="font-terminal text-xs text-gray-500">
              If this issue persists, please contact support or check our status page.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
