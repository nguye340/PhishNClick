"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  LogIn,
  Sparkles,
  Check,
  X,
} from "lucide-react"
import axios from "@/lib/axios"

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <Check className="w-4 h-4 text-arcade-green flex-shrink-0" />
      ) : (
        <X className="w-4 h-4 text-gray-500 flex-shrink-0" />
      )}
      <span className={`text-sm font-terminal ${met ? "text-arcade-green" : "text-gray-400"}`}>
        {text}
      </span>
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Password strength validation
  const passwordRequirements = {
    minLength: form.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(form.password),
    hasLowerCase: /[a-z]/.test(form.password),
    hasNumber: /[0-9]/.test(form.password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(form.password),
  }

  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean)
  const metRequirementsCount = Object.values(passwordRequirements).filter(Boolean).length
  const passwordStrength =
    metRequirementsCount === 5 ? "Strong" : metRequirementsCount >= 3 ? "Medium" : "Weak"
  const strengthColor =
    passwordStrength === "Strong"
      ? "text-arcade-green"
      : passwordStrength === "Medium"
      ? "text-arcade-yellow"
      : "text-arcade-red"

  const handleChange = (field: "username" | "email" | "password") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!form.username.trim() || !form.email.trim() || !form.password.trim()) {
      setError("All fields are required.")
      return
    }

    if (!allRequirementsMet) {
      setError("Please meet all password requirements before registering.")
      return
    }

    try {
      setLoading(true)
      await axios.post("/api/auth/register", {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      router.push("/auth/login?registered=1")
    } catch (err) {
      console.error("Registration failed", err)
      setError("Registration failed. Please verify your details and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-arcade-bg text-white px-4 pt-24 pb-12">
      <div className="w-full max-w-3xl grid md:grid-cols-2 gap-10 bg-black/80 border-2 border-arcade-cyan rounded-2xl p-10 shadow-2xl backdrop-blur-sm">
        <div className="hidden md:flex flex-col justify-between rounded-xl border border-arcade-cyan/40 bg-gradient-to-br from-arcade-cyan/15 via-black/70 to-black/40 p-6">
          <div className="space-y-6">
            <div className="relative inline-flex">
              <ShieldCheck className="w-14 h-14 text-arcade-cyan drop-shadow-glow-cyan" />
              <div className="absolute inset-0 w-14 h-14 bg-arcade-cyan/20 blur-2xl rounded-full"></div>
            </div>
            <h2 className="font-arcade text-xl text-arcade-cyan leading-snug break-words glow-heading">
              Join the PhishNClick Academy
            </h2>
            <p className="font-terminal text-lg text-gray-300 leading-relaxed">
              Create your training profile to unlock personalized phishing challenges, track your progress, and climb
              the cybersecurity leaderboard.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-arcade-yellow" />
              <span className="font-terminal text-base text-gray-200">Earn XP and level up your skills.</span>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-arcade-magenta" />
              <span className="font-terminal text-base text-gray-200">Compete against friends in special events.</span>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-arcade-green" />
              <span className="font-terminal text-base text-gray-200">Unlock exclusive boss battles and quests.</span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-col items-center gap-3 mb-8">
            <User className="w-12 h-12 text-arcade-cyan drop-shadow-glow-cyan" />
            <h1 className="font-arcade text-2xl text-arcade-cyan glow-heading break-words text-center">Create Account</h1>
            <p className="font-terminal text-base text-gray-300 text-center break-words">
              Your cyber-defense journey begins here
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border-2 border-arcade-red bg-arcade-red/10 px-4 py-3 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-arcade-red flex-shrink-0 mt-0.5" />
              <p className="text-base text-arcade-red font-terminal leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="flex items-center gap-2 text-lg font-terminal text-arcade-cyan mb-3">
                <User className="w-5 h-5" />
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={form.username}
                onChange={handleChange("username")}
                className="w-full rounded-lg bg-black/60 border-2 border-arcade-cyan/50 px-4 py-3 text-base text-white placeholder-gray-500 focus:border-arcade-cyan focus:outline-none focus:ring-2 focus:ring-arcade-cyan/30 transition-all"
                placeholder="ArcadeAgent"
                autoComplete="username"
              />
            </div>

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
                onChange={handleChange("email")}
                className="w-full rounded-lg bg-black/60 border-2 border-arcade-cyan/50 px-4 py-3 text-base text-white placeholder-gray-500 focus:border-arcade-cyan focus:outline-none focus:ring-2 focus:ring-arcade-cyan/30 transition-all"
                placeholder="player@phishnclick.com"
                autoComplete="email"
              />
            </div>

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
                  onChange={handleChange("password")}
                  className="w-full rounded-lg bg-black/60 border-2 border-arcade-cyan/50 px-4 py-3 pr-12 text-base text-white placeholder-gray-500 focus:border-arcade-cyan focus:outline-none focus:ring-2 focus:ring-arcade-cyan/30 transition-all"
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-arcade-cyan/70 hover:text-arcade-cyan transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {form.password && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-terminal text-gray-400">Password Strength:</span>
                    <span className={`text-sm font-terminal font-bold ${strengthColor}`}>
                      {passwordStrength}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <PasswordRequirement
                      met={passwordRequirements.minLength}
                      text="At least 8 characters"
                    />
                    <PasswordRequirement
                      met={passwordRequirements.hasUpperCase}
                      text="One uppercase letter (A-Z)"
                    />
                    <PasswordRequirement
                      met={passwordRequirements.hasLowerCase}
                      text="One lowercase letter (a-z)"
                    />
                    <PasswordRequirement
                      met={passwordRequirements.hasNumber}
                      text="One number (0-9)"
                    />
                    <PasswordRequirement
                      met={passwordRequirements.hasSpecialChar}
                      text="One special character (!@#$%^&*)"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !allRequirementsMet}
              className="w-full rounded-lg bg-arcade-cyan text-black font-arcade py-4 text-lg tracking-wider transition-all transform hover:-translate-y-1 hover:shadow-lg hover:shadow-arcade-cyan/50 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Creating Account..." : "Register Now"}
            </button>
          </form>

          <div className="mt-8 space-y-4 text-center">
            <p className="text-base text-gray-300 font-terminal">
              Already have an account?
              <Link
                href="/auth/login"
                className="ml-2 inline-flex items-center gap-2 text-arcade-magenta hover:text-arcade-magenta/80 font-bold underline decoration-2 underline-offset-4 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-base text-arcade-yellow hover:text-arcade-yellow/80 font-terminal transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
