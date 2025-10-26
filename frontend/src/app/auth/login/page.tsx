"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Shield, Mail, Lock, AlertCircle, ArrowLeft, UserPlus, Chrome, Github } from "lucide-react"
import { useAuth } from "@/context/auth.context"
import axios from "@/lib/axios"

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuth()
  const [form, setForm] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

    if (!clientId || !backendUrl) {
      console.error("Missing Google OAuth environment variables")
      setError("Google sign-in is temporarily unavailable. Please contact support.")
      return
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${backendUrl}/api/auth/google/callback`,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent"
    })

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  const handleGithubLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

    if (!clientId || !backendUrl) {
      console.error("Missing GitHub OAuth environment variables")
      setError("GitHub sign-in is temporarily unavailable. Please contact support.")
      return
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${backendUrl}/api/auth/github/callback`,
      scope: "user:email"
    })

    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await axios.post("/api/auth/login", form)
      const { role, email, name, user, profilePicture } = res.data
      const derivedEmail = email ?? user?.email ?? form.email
      const derivedName = name ?? user?.name ?? derivedEmail?.split("@")[0] ?? "Player"
      setAuth({
        accessToken: true, // Token is in httpOnly cookie, not accessible to JS
        role,
        email: derivedEmail,
        name: derivedName,
        profilePicture: profilePicture ?? user?.profilePicture ?? null,
      })
      
      // Redirect admins to admin dashboard, regular users to normal dashboard
      if (role === "admin") {
        router.push("/admin")
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      setError("Login failed. Please check your credentials.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-arcade-bg text-white px-4">
      <div className="w-full max-w-lg bg-black/80 border-2 border-arcade-cyan rounded-xl p-10 shadow-2xl backdrop-blur-sm">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="relative">
            <Shield className="w-12 h-12 text-arcade-cyan drop-shadow-glow-cyan" />
            <div className="absolute inset-0 w-12 h-12 bg-arcade-cyan/20 blur-xl rounded-full"></div>
          </div>
          <h1 className="font-arcade text-3xl text-arcade-cyan glow-heading">
            Login
          </h1>
          <p className="font-terminal text-lg text-gray-300">
            Enter your credentials to continue
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border-2 border-arcade-red bg-arcade-red/10 px-4 py-3 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-arcade-red flex-shrink-0 mt-0.5" />
            <p className="text-base text-arcade-red font-terminal leading-relaxed">
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="flex items-center gap-2 text-lg font-terminal text-arcade-cyan mb-3">
              <Mail className="w-5 h-5" />
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg bg-black/60 border-2 border-arcade-cyan/50 px-4 py-3 text-base text-white placeholder-gray-500 focus:border-arcade-cyan focus:outline-none focus:ring-2 focus:ring-arcade-cyan/30 transition-all"
              placeholder="player@phishnclick.com"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="flex items-center gap-2 text-lg font-terminal text-arcade-cyan mb-3">
              <Lock className="w-5 h-5" />
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg bg-black/60 border-2 border-arcade-cyan/50 px-4 py-3 pr-12 text-base text-white placeholder-gray-500 focus:border-arcade-cyan focus:outline-none focus:ring-2 focus:ring-arcade-cyan/30 transition-all"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-arcade-cyan/70 hover:text-arcade-cyan transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-arcade-cyan text-black font-arcade py-4 text-lg tracking-wider transition-all transform hover:-translate-y-1 hover:shadow-lg hover:shadow-arcade-cyan/50 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none active:translate-y-0"
          >
            {loading ? "Signing in..." : "Start Playing"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-black/80 text-gray-500 font-terminal text-base">OR</span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full rounded-lg bg-white text-gray-800 font-terminal py-3 px-4 text-base flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 hover:shadow-lg hover:shadow-white/30 active:translate-y-0"
          >
            <Chrome className="w-5 h-5" />
            Continue with Google
          </button>

          <button
            type="button"
            onClick={handleGithubLogin}
            className="w-full rounded-lg bg-gray-800 text-white font-terminal py-3 px-4 text-base flex items-center justify-center gap-3 border-2 border-gray-600 transition-all transform hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-600/30 active:translate-y-0"
          >
            <Github className="w-5 h-5" />
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
        </div>

        {/* Register Link */}
        <p className="text-center text-lg text-gray-300 font-terminal">
          New to PhishNClick?{" "}
          <Link 
            href="/auth/register" 
            className="inline-flex items-center gap-2 text-arcade-magenta hover:text-arcade-magenta/80 font-bold underline decoration-2 underline-offset-4 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Create Account
          </Link>
        </p>

        {/* Guest Play Option */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-base text-arcade-yellow hover:text-arcade-yellow/80 font-terminal transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue as Guest
          </Link>
        </div>
      </div>
    </div>
  )
}
