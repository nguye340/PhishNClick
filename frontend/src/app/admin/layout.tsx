"use client"

import React, { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth.context"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { auth, loading } = useAuth()
  const [redirecting, setRedirecting] = useState(false)

  // Only admin role allowed
  const allowedRoles = ["admin"]

  useEffect(() => {
    // Check if user is not logged in
    if (!loading && !auth?.accessToken) {
      setRedirecting(true)
      const redirectTarget = encodeURIComponent(pathname || "/admin")
      router.replace(`/auth/login?redirect=${redirectTarget}`)
      return
    }

    // Check if user is logged in but not admin
    if (!loading && auth?.accessToken && !allowedRoles.includes(auth.role)) {
      router.replace("/unauthorized")
    }
  }, [auth?.accessToken, auth?.role, loading, pathname, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-arcade-bg text-white">
        <p className="font-terminal text-lg text-arcade-cyan">Checking admin access...</p>
      </div>
    )
  }

  if (!auth?.accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-arcade-bg text-white px-4">
        <div className="w-full max-w-md rounded-xl border border-arcade-cyan/40 bg-black/70 p-8 text-center space-y-4">
          <h2 className="font-arcade text-2xl text-arcade-cyan">Authentication Required</h2>
          <p className="font-terminal text-sm text-gray-300">
            You need to log in as an admin to access this area. {redirecting ? "Redirecting you now..." : ""}
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-md bg-arcade-cyan px-4 py-2 font-terminal text-sm text-black hover:bg-arcade-cyan/90 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  if (!allowedRoles.includes(auth.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-arcade-bg text-white px-4">
        <div className="w-full max-w-md rounded-xl border border-red-500/40 bg-black/70 p-8 text-center space-y-4">
          <h2 className="font-arcade text-2xl text-red-500">Access Denied</h2>
          <p className="font-terminal text-sm text-gray-300">
            You don't have permission to access the admin dashboard.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-arcade-cyan px-4 py-2 font-terminal text-sm text-black hover:bg-arcade-cyan/90 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
