"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { useAuth } from "@/context/auth.context"
import axios from "@/lib/axios"
import { AlertCircle, Loader2, Pencil, ShieldCheck, Camera, Upload } from "lucide-react"

interface UserProfile {
  id?: string
  name?: string
  email?: string
  role?: string
  profilePicture?: string
  createdAt?: string
  updatedAt?: string
}

export default function ProfilePage() {
  const { auth, setAuth } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB")
      return
    }

    try {
      setUploading(true)
      setError(null)
      const formData = new FormData()
      formData.append("profilePicture", file)

      const response = await axios.post("/api/user/profile/picture", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      // Update profile with new picture URL
      setProfile((prev) => (prev ? { ...prev, profilePicture: response.data.profilePicture } : null))
      
      // Update auth context so navbar reflects the change immediately
      setAuth((prev: any) => (prev ? { ...prev, profilePicture: response.data.profilePicture } : null))
    } catch (err) {
      console.error("Failed to upload profile picture", err)
      setError("Failed to upload image. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await axios.post("/api/user/profile")
        setProfile(response.data)
      } catch (err: unknown) {
        console.error("Failed to fetch profile", err)
        setError("Failed to load profile. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  return (
    <main className="min-h-screen bg-arcade-bg/95 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        <header className="flex flex-col items-center gap-6 mb-10">
          <div className="relative group">
            <div className="relative w-32 h-32 rounded-full border-4 border-arcade-cyan bg-black/60 flex items-center justify-center overflow-hidden shadow-lg shadow-arcade-cyan/30">
              <Image
                src={profile?.profilePicture ? `http://localhost:5000${profile.profilePicture}` : "/img/catphish_white.svg"}
                alt="Profile avatar"
                width={128}
                height={128}
                className={profile?.profilePicture ? "object-cover w-full h-full" : "object-contain"}
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-arcade-cyan animate-spin" />
                </div>
              )}
            </div>
            <button
              onClick={handleImageClick}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-arcade-cyan text-black flex items-center justify-center border-2 border-black shadow-lg hover:bg-arcade-cyan/90 transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Upload profile picture"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <div className="text-center">
            <h1 className="font-arcade text-3xl text-arcade-cyan glow-heading">Player Profile</h1>
            <p className="font-terminal text-base text-gray-300">
              Welcome back, {auth?.name ?? auth?.email ?? "Player"}
            </p>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/60 px-6 py-5 text-arcade-cyan">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-terminal text-base">Loading your profile...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 rounded-lg border border-arcade-red bg-arcade-red/15 px-6 py-5">
            <AlertCircle className="w-5 h-5 text-arcade-red" />
            <span className="font-terminal text-base text-arcade-red">{error}</span>
          </div>
        ) : profile ? (
          <section className="space-y-6">
            <div className="rounded-xl border border-arcade-cyan/40 bg-black/60 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-arcade text-xl text-arcade-cyan">Account Details</h2>
                <button className="inline-flex items-center gap-2 rounded-md border border-arcade-cyan px-3 py-2 font-terminal text-sm text-arcade-cyan hover:bg-arcade-cyan/10 transition-colors">
                  <Pencil className="w-4 h-4" />
                  Edit Username
                </button>
              </div>

              <dl className="space-y-4 font-terminal text-base text-gray-200">
                <div className="flex flex-col gap-1">
                  <dt className="text-sm uppercase tracking-widest text-gray-500">Username</dt>
                  <dd className="text-lg text-white">{profile.name ?? "Unknown"}</dd>
                </div>

                <div className="flex flex-col gap-1">
                  <dt className="text-sm uppercase tracking-widest text-gray-500">Email</dt>
                  <dd className="text-lg text-white">{profile.email ?? "No email on file"}</dd>
                </div>

                <div className="flex flex-col gap-1">
                  <dt className="text-sm uppercase tracking-widest text-gray-500">Role</dt>
                  <dd className="inline-flex items-center gap-2 text-lg text-arcade-cyan">
                    <ShieldCheck className="w-4 h-4" />
                    {(profile.role ?? auth?.role ?? "user").toUpperCase()}
                  </dd>
                </div>

                <div className="flex flex-col gap-1">
                  <dt className="text-sm uppercase tracking-widest text-gray-500">Joined</dt>
                  <dd className="text-lg text-white">
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Unknown"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/50 p-6 shadow-inner">
              <h3 className="font-arcade text-lg text-arcade-cyan mb-3">Profile Notes</h3>
              <p className="font-terminal text-base text-gray-300 leading-relaxed">
                This is your placeholder profile view. Future updates will let you customize your avatar, edit account
                details, and review your security progress. Stay tuned!
              </p>
            </div>
          </section>
        ) : (
          <div className="rounded-lg border border-white/10 bg-black/60 px-6 py-5 font-terminal text-base text-gray-300">
            No profile information could be retrieved.
          </div>
        )}
      </div>
    </main>
  )
}
