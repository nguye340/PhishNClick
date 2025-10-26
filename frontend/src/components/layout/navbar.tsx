"use client"

import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Info, LogIn, LogOut, User, UserCircle, ChevronDown, LayoutDashboard, BadgeInfo, Shield } from "lucide-react"
import { AboutUsModal } from "../modals/about-us-modal"
import { useAuth } from "@/context/auth.context"
import axios from "@/lib/axios"

export function Navbar() {
  const router = useRouter()
  // Auth is optional - users can play as guests without logging in
  // Logging in allows users to track their learning path and view dashboard
  const { auth, setAuth } = useAuth()
  const [isLoginPressed, setIsLoginPressed] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isProfileOpen])

  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000"

  const roleLabel = (() => {
    const normalizedRole = auth?.role?.toLowerCase()
    if (!auth?.accessToken) return "Guest"
    if (normalizedRole === "admin") return "Administrator"
    if (normalizedRole === "user" || normalizedRole === "member") return "User"
    return "User"
  })()

  const dashboardHref = "/dashboard"
  const displayName = auth?.name ?? auth?.email ?? "Player"

  const profileImageSrc = (() => {
    const picture = auth?.profilePicture
    if (!picture) return null
    if (/^https?:\/\//i.test(picture)) {
      return picture
    }
    return `${backendBaseUrl}${picture}`
  })()

  const handleLogin = () => {
    setIsLoginPressed(true)
    
    // Clean up cursor before navigation to prevent double cursor
    const cleanupCursor = () => {
      // Remove any existing animation frames
      const rafIds: number[] = []
      let rafId = requestAnimationFrame(function cleanup() {
        const nextRafId = requestAnimationFrame(cleanup)
        rafIds.push(nextRafId)
      })
      rafIds.push(rafId)
      
      // Cancel all animation frames after a short delay
      setTimeout(() => {
        rafIds.forEach(id => cancelAnimationFrame(id))
        // Navigate to the next page
        router.push("/auth/login")
      }, 50)
    }
    
    // Navigate after a short delay to allow the animation to play
    setTimeout(cleanupCursor, 950)
  }

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout")
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setAuth(null)
      router.push("/")
    }
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-arcade-bg/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <Image 
                src="/img/catphish_white.svg" 
                alt="Catphish Logo" 
                fill 
                className="object-contain filter drop-shadow-glow-cyan"
              />
            </div>
            <span className="font-arcade text-arcade-cyan glow-heading">CatPhish</span>
          </Link>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setShowAboutModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded text-arcade-yellow hover:text-arcade-cyan transition-colors"
            >
              <Info className="w-4 h-4" />
              <span className="font-terminal text-sm">About Us</span>
            </button>
            
            {auth?.accessToken ? (
              <div className="relative" ref={profileRef}>
                <button
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-left hover:border-arcade-cyan/60 transition-all"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                >
                  {profileImageSrc ? (
                    <div className="relative w-8 h-8 rounded-full border-2 border-arcade-cyan overflow-hidden flex-shrink-0">
                      <Image
                        src={profileImageSrc}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <UserCircle className="w-8 h-8 text-arcade-cyan" />
                  )}
                  <div className="flex flex-col">
                    <span className="font-terminal text-base text-white leading-none">{displayName}</span>
                    <span className="text-sm text-arcade-yellow leading-none">{roleLabel}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-arcade-cyan transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-lg border border-white/10 bg-arcade-bg/95 shadow-xl p-4 space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <BadgeInfo className="w-4 h-4 text-arcade-cyan" />
                        <span className="font-terminal text-base text-arcade-cyan">Account</span>
                      </div>
                      <p className="text-base text-gray-200 font-terminal leading-snug">{displayName}</p>
                      {auth?.email && (
                        <p className="text-sm text-gray-400 font-terminal">{auth.email}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false)
                          router.push(dashboardHref)
                        }}
                        className="flex items-center gap-2 rounded-md border border-arcade-cyan/40 px-3 py-2 text-base font-terminal text-arcade-cyan hover:bg-arcade-cyan/10 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </button>
                      {auth?.role === "admin" && (
                        <button
                          onClick={() => {
                            setIsProfileOpen(false)
                            router.push("/admin")
                          }}
                          className="flex items-center gap-2 rounded-md border border-arcade-magenta/40 px-3 py-2 text-base font-terminal text-arcade-magenta hover:bg-arcade-magenta/10 transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Panel
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setIsProfileOpen(false)
                          router.push("/profile")
                        }}
                        className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-base font-terminal text-gray-200 hover:border-arcade-cyan/50 hover:text-arcade-cyan transition-colors"
                      >
                        <UserCircle className="w-4 h-4" />
                        Profile
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false)
                        handleLogout()
                      }}
                      className="flex items-center gap-2 rounded-md border border-arcade-red px-3 py-2 text-base font-terminal text-arcade-red hover:bg-arcade-red/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/30 px-4 py-2">
                  <UserCircle className="w-6 h-6 text-arcade-cyan" />
                  <div className="flex flex-col">
                    <span className="font-terminal text-sm text-white leading-none">Guest</span>
                    <span className="text-xs text-gray-400 leading-none">Log in to access dashboard</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleLogin}
                    className={`flex items-center gap-2 px-4 py-2 rounded border border-arcade-cyan text-[#00ffff] bg-transparent hover:bg-arcade-cyan hover:text-black focus:text-black active:text-black transition-all duration-200 group vhs-effect ${isLoginPressed ? 'active' : ''}`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span className="font-terminal text-sm">Login</span>
                  </button>
                  <Link 
                    href="/auth/register" 
                    className="flex items-center gap-2 px-4 py-2 rounded bg-arcade-magenta text-black hover:bg-opacity-90 transition-colors vhs-effect"
                  >
                    <User className="w-4 h-4" />
                    <span className="font-terminal text-sm">Register</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
      
      <AboutUsModal 
        isOpen={showAboutModal} 
        onClose={() => setShowAboutModal(false)} 
      />
    </>
  )
}
