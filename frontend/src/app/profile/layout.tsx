"use client"

import React, { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth.context"

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { auth, loading } = useAuth()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (!loading && !auth?.accessToken) {
      setRedirecting(true)
      const redirectTarget = encodeURIComponent(pathname || "/profile")
      router.replace(`/auth/login?redirect=${redirectTarget}`)
    }
  }, [auth?.accessToken, loading, pathname, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-arcade-bg text-white">
        <p className="font-terminal text-lg text-arcade-cyan">Checking your access...</p>
      </div>
    )
  }

  if (!auth?.accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-arcade-bg text-white px-4">
        <div className="w-full max-w-md rounded-xl border border-arcade-cyan/40 bg-black/70 p-8 text-center space-y-4">
          <h2 className="font-arcade text-2xl text-arcade-cyan">Authentication Required</h2>
          <p className="font-terminal text-sm text-gray-300">
            You need to log in to view your profile. {redirecting ? "Redirecting you now..." : ""}
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-md bg-arcade-cyan px-4 py-2 font-terminal text-sm text-black transition-colors hover:bg-arcade-cyan/90"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
