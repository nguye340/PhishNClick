"use client"

import React from "react"
import Link from "next/link"
import { ShieldAlert, Home, ArrowLeft } from "lucide-react"
import { useAuth } from "@/context/auth.context"

export default function UnauthorizedPage() {
  const { auth } = useAuth()

  return (
    <div className="min-h-screen bg-arcade-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-black/70 border border-red-500/40 rounded-xl p-8 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"></div>
              <ShieldAlert className="relative w-20 h-20 text-red-500" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="font-arcade text-3xl text-red-500">Access Denied</h1>
            <p className="font-terminal text-sm text-gray-300">
              You don't have permission to access this page.
            </p>
          </div>

          {/* User Info */}
          {auth?.accessToken && (
            <div className="bg-black/60 border border-white/10 rounded-lg p-4 space-y-1">
              <p className="font-terminal text-xs text-gray-400">Logged in as:</p>
              <p className="font-terminal text-sm text-white">{auth.name}</p>
              <p className="font-terminal text-xs text-arcade-cyan">Role: {auth.role}</p>
            </div>
          )}

          {/* Message */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="font-terminal text-sm text-gray-300">
              This area is restricted to administrators only. If you believe you should have access, please contact your system administrator.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-arcade-cyan text-black font-terminal text-sm hover:bg-arcade-cyan/90 transition-colors"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Link>
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-white/10 text-white font-terminal text-sm hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs font-terminal text-gray-500 mt-6">
          Error Code: 403 - Forbidden
        </p>
      </div>
    </div>
  )
}
