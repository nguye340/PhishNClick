"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  User,
  Mail,
  Calendar,
  ExternalLink,
  Trash,
  Unlock
} from "lucide-react"

interface UserRiskData {
  _id: string
  name: string
  email: string
  role: string
  createdAt: string
  lastLogin?: string
  overallScore: number
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  weakCategories: Array<{
    category: string
    accuracy: number
    total: number
  }>
  metadata: {
    totalInteractions: number
    accuracy: number
    sessionCount: number
    daysSinceLastActivity: number
  }
}

interface UserRiskTableProps {
  users: UserRiskData[]
  loading: boolean
  onSort: (field: string) => void
  onFilterRisk: (level: string | null) => void
  currentFilter: string | null
  onDelete: (user: UserRiskData) => Promise<void>
  deletingId: string | null
  onUnlock?: (user: UserRiskData) => Promise<void>
  unlockingId?: string | null
}

export function UserRiskTable({ users, loading, onSort, onFilterRisk, currentFilter, onDelete, deletingId, onUnlock, unlockingId }: UserRiskTableProps) {
  const [sortField, setSortField] = useState<string>("overallScore")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const handleSortClick = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
    onSort(field)
  }

  const getRiskBadgeClasses = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return "text-red-500 bg-red-500/20 border-red-500/40"
      case "HIGH":
        return "text-orange-500 bg-orange-500/20 border-orange-500/40"
      case "MEDIUM":
        return "text-yellow-500 bg-yellow-500/20 border-yellow-500/40"
      case "LOW":
        return "text-green-500 bg-green-500/20 border-green-500/40"
      default:
        return "text-gray-500 bg-gray-500/20 border-gray-500/40"
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "CRITICAL":
      case "HIGH":
        return <AlertTriangle className="w-4 h-4" />
      case "MEDIUM":
        return <TrendingDown className="w-4 h-4" />
      case "LOW":
        return <TrendingUp className="w-4 h-4" />
      default:
        return null
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never"
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const riskFilters = [
    { label: "All", value: null },
    { label: "Critical", value: "CRITICAL" },
    { label: "High", value: "HIGH" },
    { label: "Medium", value: "MEDIUM" },
    { label: "Low", value: "LOW" }
  ]

  if (loading) {
    return (
      <div className="bg-black/60 border border-white/10 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-16 rounded bg-white/5" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black/60 border border-white/10 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-arcade text-lg text-white">User Risk Assessment</h2>
            <p className="text-sm font-terminal text-gray-400 mt-1">{users.length} users analyzed</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {riskFilters.map((filter) => (
            <button
              key={filter.label}
              onClick={() => onFilterRisk(filter.value)}
              className={`px-4 py-2 rounded-md font-terminal text-sm transition-all ${
                currentFilter === filter.value
                  ? "bg-arcade-cyan text-black border-2 border-arcade-cyan"
                  : "bg-black/40 text-gray-400 border border-white/10 hover:border-arcade-cyan/40"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-black/40">
            <tr className="border-b border-white/10">
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSortClick("name")}
                  className="flex items-center gap-2 text-xs font-terminal text-gray-400 uppercase tracking-wider hover:text-arcade-cyan transition-colors"
                >
                  User
                  {sortField === "name" && (sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSortClick("overallScore")}
                  className="flex items-center gap-2 text-xs font-terminal text-gray-400 uppercase tracking-wider hover:text-arcade-cyan transition-colors"
                >
                  Risk Score
                  {sortField === "overallScore" && (sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-terminal text-gray-400 uppercase tracking-wider">Risk Level</span>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSortClick("accuracy")}
                  className="flex items-center gap-2 text-xs font-terminal text-gray-400 uppercase tracking-wider hover:text-arcade-cyan transition-colors"
                >
                  Accuracy
                  {sortField === "accuracy" && (sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-terminal text-gray-400 uppercase tracking-wider">Activity</span>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-terminal text-gray-400 uppercase tracking-wider">Weak Areas</span>
              </th>
              <th className="px-6 py-3 text-right">
                <span className="text-xs font-terminal text-gray-400 uppercase tracking-wider">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <p className="font-terminal text-gray-400">No users found</p>
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <motion.tr
                  key={user._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-arcade-cyan bg-arcade-cyan/20">
                        <User className="h-5 w-5 text-arcade-cyan" />
                      </div>
                      <div>
                        <p className="font-terminal text-white text-sm">{user.name}</p>
                        <p className="font-terminal text-gray-500 text-xs flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="relative h-16 w-16">
                      <svg className="h-16 w-16 transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-white/10" />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${(user.overallScore / 100) * 175.93} 175.93`}
                          className={
                            user.riskLevel === "CRITICAL"
                              ? "text-red-500"
                              : user.riskLevel === "HIGH"
                              ? "text-orange-500"
                              : user.riskLevel === "MEDIUM"
                              ? "text-yellow-500"
                              : "text-green-500"
                          }
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-arcade text-white">{user.overallScore}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-terminal border ${getRiskBadgeClasses(user.riskLevel)}`}>
                      {getRiskIcon(user.riskLevel)}
                      {user.riskLevel}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div>
                      <p className="font-terminal text-white text-sm">{user.metadata.accuracy}%</p>
                      <p className="font-terminal text-gray-500 text-xs">{user.metadata.totalInteractions} interactions</p>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div>
                      <p className="font-terminal text-white text-sm">{user.metadata.sessionCount} sessions</p>
                      <p className="font-terminal text-gray-500 text-xs flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(user.lastLogin)}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {user.weakCategories.length > 0 ? (
                      <div className="space-y-1">
                        {user.weakCategories.slice(0, 2).map((category, idx) => (
                          <div key={idx} className="text-xs font-terminal text-orange-400">
                            {category.category.replace(/_/g, " ")} ({category.accuracy}%)
                          </div>
                        ))}
                        {user.weakCategories.length > 2 && (
                          <div className="text-xs font-terminal text-gray-500">+{user.weakCategories.length - 2} more</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-terminal text-gray-500">None</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/users/${user._id}`}
                        className="inline-flex items-center gap-2 rounded-md border border-arcade-cyan/40 bg-arcade-cyan/20 px-3 py-1.5 font-terminal text-sm text-arcade-cyan transition-colors hover:bg-arcade-cyan/30"
                      >
                        View Details
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                      {onUnlock && (
                        <button
                          onClick={() => onUnlock(user)}
                          disabled={unlockingId === user._id}
                          className="inline-flex items-center gap-2 rounded-md border border-arcade-yellow/40 bg-arcade-yellow/20 px-3 py-1.5 font-terminal text-sm text-arcade-yellow transition-colors hover:bg-arcade-yellow/30 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Unlock className="h-4 w-4" />
                          {unlockingId === user._id ? "Unlocking..." : "Unlock"}
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(user)}
                        disabled={deletingId === user._id}
                        className="inline-flex items-center gap-2 rounded-md border border-red-500/40 bg-red-500/20 px-3 py-1.5 font-terminal text-sm text-red-400 transition-colors hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash className="h-4 w-4" />
                        {deletingId === user._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
