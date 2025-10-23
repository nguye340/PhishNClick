"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/context/auth.context"
import axios from "@/lib/axios"
import { Trash2, Shield, User, Mail, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface UserData {
  _id: string
  username: string
  email: string
  role: string
  profilePicture?: string
  createdAt: string
  updatedAt: string
}

interface UsersResponse {
  users: UserData[]
  total: number
  currentPage: number
  totalPages: number
}

export default function AdminDashboard() {
  const { auth } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  const fetchUsers = async (pageNum: number) => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get<UsersResponse>(`/api/user?page=${pageNum}&limit=10`)
      setUsers(response.data.users)
      setTotal(response.data.total)
      setPage(response.data.currentPage ?? pageNum)
      setTotalPages(response.data.totalPages)
    } catch (err: any) {
      console.error("Failed to fetch users:", err)
      setError(err.response?.data?.error || "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(page)
  }, [])

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingUserId(userId)
      await axios.delete(`/api/user/${userId}`)
      
      // Refresh the user list
      await fetchUsers(page)
      
      alert(`User "${username}" has been deleted successfully.`)
    } catch (err: any) {
      console.error("Failed to delete user:", err)
      alert(err.response?.data?.error || "Failed to delete user")
    } finally {
      setDeletingUserId(null)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
      fetchUsers(newPage)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-arcade-bg">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image src="/img/catphish_white.svg" alt="Logo" width={32} height={32} />
              <span className="font-arcade text-arcade-cyan">CatPhish</span>
            </Link>
            <span className="text-gray-500">|</span>
            <h1 className="font-arcade text-xl text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-arcade-magenta" />
              Admin Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm font-terminal text-gray-400">
            <User className="w-4 h-4" />
            <span>{auth?.name}</span>
            <span className="text-arcade-magenta">({auth?.role})</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-black/60 border border-arcade-cyan/40 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-terminal text-gray-400">Total Users</p>
                <p className="text-3xl font-arcade text-arcade-cyan mt-1">{total}</p>
              </div>
              <User className="w-12 h-12 text-arcade-cyan/30" />
            </div>
          </div>

          <div className="bg-black/60 border border-arcade-magenta/40 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-terminal text-gray-400">Current Page</p>
                <p className="text-3xl font-arcade text-arcade-magenta mt-1">{page} / {totalPages}</p>
              </div>
              <Calendar className="w-12 h-12 text-arcade-magenta/30" />
            </div>
          </div>

          <div className="bg-black/60 border border-arcade-yellow/40 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-terminal text-gray-400">Admins</p>
                <p className="text-3xl font-arcade text-arcade-yellow mt-1">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
              <Shield className="w-12 h-12 text-arcade-yellow/30" />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-black/60 border border-white/10 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="font-arcade text-lg text-white">User Management</h2>
            <p className="text-sm font-terminal text-gray-400 mt-1">
              Manage all registered users
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="font-terminal text-arcade-cyan">Loading users...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <p className="font-terminal text-red-500">{error}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="font-terminal text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/40">
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-3 text-left text-xs font-terminal text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-terminal text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-terminal text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-terminal text-gray-400 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-terminal text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-full border-2 border-arcade-cyan overflow-hidden flex-shrink-0 bg-black/60">
                            {user.profilePicture ? (
                              <Image
                                src={`http://localhost:5000${user.profilePicture}`}
                                alt={user.username}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <User className="w-full h-full p-2 text-arcade-cyan" />
                            )}
                          </div>
                          <span className="font-terminal text-white">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-300 font-terminal text-sm">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-terminal ${
                            user.role === "admin"
                              ? "bg-arcade-magenta/20 text-arcade-magenta border border-arcade-magenta/40"
                              : "bg-arcade-cyan/20 text-arcade-cyan border border-arcade-cyan/40"
                          }`}
                        >
                          {user.role === "admin" && <Shield className="w-3 h-3" />}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-terminal text-gray-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDeleteUser(user._id, user.username)}
                          disabled={deletingUserId === user._id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-500/20 text-red-500 border border-red-500/40 hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-terminal text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          {deletingUserId === user._id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
              <p className="text-sm font-terminal text-gray-400">
                Showing {users.length} of {total} users
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="p-2 rounded-md border border-white/10 text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 font-terminal text-sm text-white">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="p-2 rounded-md border border-white/10 text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
