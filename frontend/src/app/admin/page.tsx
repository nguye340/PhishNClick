"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/context/auth.context"
import axios from "@/lib/axios"
import { Shield, RefreshCw, AlertCircle } from "lucide-react"
import { OverviewKPIs } from "@/components/admin/overview-kpis"
import { UserRiskTable } from "@/components/admin/user-risk-table"

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

interface UserRiskData {
  _id: string
  name: string
  email: string
  role: string
  createdAt: string
  lastLogin?: string
  overallScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
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

export default function AdminDashboard() {
  const { auth } = useAuth()
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null)
  const [users, setUsers] = useState<UserRiskData[]>([])
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [riskFilter, setRiskFilter] = useState<string | null>(null)
  const [sortField, setSortField] = useState('overallScore')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchOverview = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get('/api/admin/overview')
      if (response.data.success) {
        setOverviewData(response.data.data)
      }
    } catch (err: any) {
      console.error("Failed to fetch overview:", err)
      setError(err.response?.data?.message || "Failed to load overview data")
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setUsersLoading(true)
      const params = new URLSearchParams()
      params.append('sortBy', sortField)
      params.append('order', 'desc')
      if (riskFilter) {
        params.append('riskLevel', riskFilter)
      }
      
      const response = await axios.get(`/api/admin/users?${params.toString()}`)
      if (response.data.success) {
        setUsers(response.data.data.users)
      }
    } catch (err: any) {
      console.error("Failed to fetch users:", err)
      setError(err.response?.data?.message || "Failed to load users")
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    fetchOverview()
    fetchUsers()
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [riskFilter, sortField])

  const handleRefresh = () => {
    fetchOverview()
    fetchUsers()
  }

  const handleSort = (field: string) => {
    setSortField(field)
  }

  const handleFilterRisk = (level: string | null) => {
    setRiskFilter(level)
  }

  const handleDeleteUser = async (user: UserRiskData) => {
    if (!confirm(`Are you sure you want to delete ${user.name} (${user.email})? This will permanently delete all their data including sessions, stats, and quiz results.`)) {
      return
    }

    try {
      setDeletingId(user._id)
      const response = await axios.delete(`/api/admin/users/${user._id}`)
      
      if (response.data.success) {
        // Remove user from local state
        setUsers(users.filter(u => u._id !== user._id))
        // Refresh overview data to update counts
        fetchOverview()
      }
    } catch (err: any) {
      console.error("Failed to delete user:", err)
      setError(err.response?.data?.message || "Failed to delete user")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-arcade-bg pt-16">
      {/* Sub-header for Admin Dashboard */}
      <div className="border-b border-white/10 bg-black/30 backdrop-blur-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-arcade-magenta" />
            <h1 className="font-arcade text-lg text-white">SOC Dashboard</h1>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-arcade-cyan/20 text-arcade-cyan border border-arcade-cyan/40 hover:bg-arcade-cyan/30 transition-colors font-terminal text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/40 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="font-terminal text-red-400">{error}</p>
          </div>
        )}

        {/* Overview KPIs */}
        <div className="mb-8">
          <OverviewKPIs data={overviewData} loading={loading} />
        </div>

        {/* User Risk Table */}
        <div className="mb-8">
          <UserRiskTable
            users={users}
            loading={usersLoading}
            onSort={handleSort}
            onFilterRisk={handleFilterRisk}
            currentFilter={riskFilter}
            onDelete={handleDeleteUser}
            deletingId={deletingId}
          />
        </div>
      </main>
    </div>
  )
}
