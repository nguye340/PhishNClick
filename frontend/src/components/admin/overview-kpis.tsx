"use client"

import React from "react"
import { Users, Activity, AlertTriangle, TrendingUp, Target, Clock } from "lucide-react"
import { motion } from "framer-motion"

interface OverviewData {
  users: {
    total: number
    active: number
    highRisk: number
    trainingCompletionRate: number
  }
  activity: {
    totalSessions: number
    totalInteractions: number
    recentSessions: number
    recentInteractions: number
  }
  performance: {
    overallAccuracy: number
    correctInteractions: number
    incorrectInteractions: number
  }
}

interface OverviewKPIsProps {
  data: OverviewData | null
  loading: boolean
}

export function OverviewKPIs({ data, loading }: OverviewKPIsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-black/60 border border-white/10 rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-white/10 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-black/60 border border-white/10 rounded-lg p-6">
        <p className="font-terminal text-gray-400">No data available</p>
      </div>
    )
  }

  const kpis = [
    {
      title: "Total Users",
      value: data.users.total,
      subtitle: `${data.users.active} active (30 days)`,
      icon: Users,
      color: "arcade-cyan",
      trend: null
    },
    {
      title: "High-Risk Users",
      value: data.users.highRisk,
      subtitle: `${Math.round((data.users.highRisk / data.users.total) * 100)}% of total`,
      icon: AlertTriangle,
      color: "red-500",
      trend: null,
      alert: data.users.highRisk > data.users.total * 0.2
    },
    {
      title: "Training Completion",
      value: `${data.users.trainingCompletionRate}%`,
      subtitle: "Users with 5+ sessions",
      icon: Target,
      color: "arcade-green",
      trend: null
    },
    {
      title: "Overall Accuracy",
      value: `${data.performance.overallAccuracy}%`,
      subtitle: `${data.performance.correctInteractions} correct`,
      icon: TrendingUp,
      color: data.performance.overallAccuracy >= 70 ? "arcade-green" : data.performance.overallAccuracy >= 50 ? "arcade-yellow" : "red-500",
      trend: null
    },
    {
      title: "Total Sessions",
      value: data.activity.totalSessions.toLocaleString(),
      subtitle: `${data.activity.recentSessions} in last 7 days`,
      icon: Activity,
      color: "arcade-magenta",
      trend: null
    },
    {
      title: "Total Interactions",
      value: data.activity.totalInteractions.toLocaleString(),
      subtitle: `${data.activity.recentInteractions} recent`,
      icon: Clock,
      color: "arcade-yellow",
      trend: null
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon
        return (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-black/60 border rounded-lg p-6 relative overflow-hidden ${
              kpi.alert 
                ? 'border-red-500/60 shadow-lg shadow-red-500/20' 
                : `border-${kpi.color}/40`
            }`}
          >
            {/* Background Icon */}
            <div className="absolute top-0 right-0 opacity-5">
              <Icon className="w-32 h-32 -mr-8 -mt-8" />
            </div>

            {/* Content */}
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-terminal text-gray-400 uppercase tracking-wider">
                  {kpi.title}
                </p>
                <Icon className={`w-5 h-5 text-${kpi.color}`} />
              </div>

              <div className="mb-2">
                <p className={`text-3xl font-arcade text-${kpi.color}`}>
                  {kpi.value}
                </p>
              </div>

              <p className="text-xs font-terminal text-gray-500">
                {kpi.subtitle}
              </p>

              {kpi.alert && (
                <div className="mt-3 pt-3 border-t border-red-500/20">
                  <p className="text-xs font-terminal text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Attention required
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
