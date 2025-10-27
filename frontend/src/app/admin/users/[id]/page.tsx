"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "@/lib/axios"
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  Activity, 
  Target,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Award,
  Shield
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

interface UserDetail {
  user: {
    id: string
    name: string
    email: string
    role: string
    createdAt: string
    lastLogin?: string
  }
  riskAssessment: {
    overallScore: number
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    factors: {
      accuracyScore: number
      reactionTimeScore: number
      engagementScore: number
      categoryScore: number
      trendScore: number
      gameScore: number
    }
    weakCategories: Array<{
      category: string
      accuracy: number
      correct: number
      incorrect: number
      total: number
    }>
    recommendations: string[]
    metadata: {
      totalInteractions: number
      accuracy: number
      sessionCount: number
      daysSinceLastActivity: number
    }
  }
  categoryStats: Array<{
    category: string
    total: number
    correct: number
    incorrect: number
    accuracy: number
    avgReactionTime: number
  }>
  gameStats: Array<{
    game: string
    sessions: number
    totalScore: number
    avgScore: number
    totalMistakes: number
  }>
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params?.id as string
  
  const [userData, setUserData] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await axios.get(`/api/admin/users/${userId}`)
        if (response.data.success) {
          setUserData(response.data.data)
        }
      } catch (err: any) {
        console.error("Failed to fetch user details:", err)
        setError(err.response?.data?.message || "Failed to load user details")
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchUserDetail()
    }
  }, [userId])

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-500 bg-red-500/20 border-red-500/40'
      case 'HIGH': return 'text-orange-500 bg-orange-500/20 border-orange-500/40'
      case 'MEDIUM': return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/40'
      case 'LOW': return 'text-green-500 bg-green-500/20 border-green-500/40'
      default: return 'text-gray-500 bg-gray-500/20 border-gray-500/40'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-arcade-bg pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-arcade-cyan mx-auto mb-4"></div>
          <p className="font-terminal text-arcade-cyan">Loading user details...</p>
        </div>
      </div>
    )
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-arcade-bg pt-16 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="font-arcade text-xl text-red-500 mb-2">Error Loading User</h2>
            <p className="font-terminal text-gray-300 mb-4">{error || "User not found"}</p>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-arcade-cyan text-black font-terminal hover:bg-arcade-cyan/90 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { user, riskAssessment, categoryStats, gameStats } = userData

  return (
    <div className="min-h-screen bg-arcade-bg pt-16">
      {/* Sub-header */}
      <div className="border-b border-white/10 bg-black/30 backdrop-blur-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 text-gray-300 border border-white/10 hover:border-arcade-cyan/40 hover:text-arcade-cyan transition-colors font-terminal text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <Shield className="w-5 h-5 text-arcade-magenta" />
            <h1 className="font-arcade text-lg text-white">User Details</h1>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* User Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/60 border border-white/10 rounded-lg p-6 mb-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-arcade-cyan/20 border-4 border-arcade-cyan flex items-center justify-center">
                <User className="w-8 h-8 text-arcade-cyan" />
              </div>
              <div>
                <h2 className="font-arcade text-2xl text-white mb-1">{user.name}</h2>
                <div className="flex items-center gap-4 text-sm font-terminal text-gray-400">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-terminal border ${getRiskColor(riskAssessment.riskLevel)}`}>
              <AlertTriangle className="w-4 h-4" />
              {riskAssessment.riskLevel} RISK
            </span>
          </div>
        </motion.div>

        {/* Risk Assessment Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Risk Score Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-black/60 border border-white/10 rounded-lg p-6"
          >
            <h3 className="font-arcade text-arcade-cyan mb-4">Risk Score</h3>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-white/10"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(riskAssessment.overallScore / 100) * 351.86} 351.86`}
                    className={
                      riskAssessment.riskLevel === 'CRITICAL' ? 'text-red-500' :
                      riskAssessment.riskLevel === 'HIGH' ? 'text-orange-500' :
                      riskAssessment.riskLevel === 'MEDIUM' ? 'text-yellow-500' :
                      'text-green-500'
                    }
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-arcade text-white">{riskAssessment.overallScore}</span>
                </div>
              </div>
            </div>
            <p className="text-center font-terminal text-gray-400 text-sm">
              Out of 100 (higher = more risk)
            </p>
          </motion.div>

          {/* Key Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black/60 border border-white/10 rounded-lg p-6"
          >
            <h3 className="font-arcade text-arcade-cyan mb-4">Key Metrics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-terminal text-gray-400 text-sm">Accuracy</span>
                <span className="font-terminal text-white text-lg">{riskAssessment.metadata.accuracy}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-terminal text-gray-400 text-sm">Interactions</span>
                <span className="font-terminal text-white text-lg">{riskAssessment.metadata.totalInteractions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-terminal text-gray-400 text-sm">Sessions</span>
                <span className="font-terminal text-white text-lg">{riskAssessment.metadata.sessionCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-terminal text-gray-400 text-sm">Last Active</span>
                <span className="font-terminal text-white text-lg">
                  {riskAssessment.metadata.daysSinceLastActivity === 0 ? 'Today' :
                   riskAssessment.metadata.daysSinceLastActivity === 1 ? 'Yesterday' :
                   `${riskAssessment.metadata.daysSinceLastActivity}d ago`}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Risk Factors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-black/60 border border-white/10 rounded-lg p-6"
          >
            <h3 className="font-arcade text-arcade-cyan mb-4">Risk Factors</h3>
            <div className="space-y-2">
              {Object.entries(riskAssessment.factors).map(([key, value]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-terminal text-gray-400 text-xs capitalize">
                      {key.replace('Score', '').replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="font-terminal text-white text-sm">{value}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        value >= 70 ? 'bg-red-500' :
                        value >= 50 ? 'bg-orange-500' :
                        value >= 30 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recommendations */}
        {riskAssessment.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-black/60 border border-arcade-yellow/40 rounded-lg p-6 mb-6"
          >
            <h3 className="font-arcade text-arcade-yellow mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Recommendations
            </h3>
            <ul className="space-y-2">
              {riskAssessment.recommendations.map((rec, index) => (
                <li key={index} className="font-terminal text-gray-300 text-sm flex items-start gap-2">
                  <span className="text-arcade-yellow mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Weak Categories */}
        {riskAssessment.weakCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-black/60 border border-white/10 rounded-lg p-6 mb-6"
          >
            <h3 className="font-arcade text-white mb-4">Weak Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {riskAssessment.weakCategories.map((cat, index) => (
                <div key={index} className="bg-black/40 border border-orange-500/40 rounded-lg p-4">
                  <h4 className="font-terminal text-orange-400 text-sm mb-2">
                    {cat.category.replace(/_/g, ' ').toUpperCase()}
                  </h4>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-terminal text-gray-400 text-xs">Accuracy</span>
                    <span className="font-terminal text-white text-lg">{cat.accuracy}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-terminal text-gray-500">
                    <span>{cat.correct} correct</span>
                    <span>{cat.incorrect} incorrect</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Category Performance */}
        {categoryStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-black/60 border border-white/10 rounded-lg overflow-hidden mb-6"
          >
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="font-arcade text-white">Category Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/40">
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-3 text-left text-xs font-terminal text-gray-400 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-terminal text-gray-400 uppercase">Accuracy</th>
                    <th className="px-6 py-3 text-left text-xs font-terminal text-gray-400 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-terminal text-gray-400 uppercase">Avg Reaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {categoryStats.map((cat, index) => (
                    <tr key={index} className="hover:bg-white/5">
                      <td className="px-6 py-4 font-terminal text-white text-sm">
                        {cat.category ? cat.category.replace(/_/g, ' ') : 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-terminal text-white text-sm">{cat.accuracy}%</span>
                          <div className="w-24 bg-white/10 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                cat.accuracy >= 80 ? 'bg-green-500' :
                                cat.accuracy >= 60 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${cat.accuracy}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-terminal text-gray-400 text-sm">
                        {cat.correct}/{cat.total}
                      </td>
                      <td className="px-6 py-4 font-terminal text-gray-400 text-sm">
                        {cat.avgReactionTime ? `${(cat.avgReactionTime / 1000).toFixed(1)}s` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Game Performance */}
        {gameStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-black/60 border border-white/10 rounded-lg overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="font-arcade text-white">Game Performance</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
              {gameStats.map((game, index) => (
                <div key={index} className="bg-black/40 border border-arcade-cyan/40 rounded-lg p-4">
                  <h4 className="font-arcade text-arcade-cyan text-sm mb-3">{game.game}</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-terminal text-gray-400 text-xs">Sessions</span>
                      <span className="font-terminal text-white text-sm">{game.sessions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-terminal text-gray-400 text-xs">Avg Score</span>
                      <span className="font-terminal text-white text-sm">{game.avgScore}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-terminal text-gray-400 text-xs">Mistakes</span>
                      <span className="font-terminal text-white text-sm">{game.totalMistakes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
