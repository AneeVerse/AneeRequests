"use client"
import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/lib/contexts/AuthContext"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import MongoDBStorageWidget from "@/components/MongoDBStorageWidget"

interface Profile {
  id?: string
  name: string
  email: string
  avatar_url?: string
  language?: string
}

export default function ProfileAndAccountPage() {
  const { user, updateProfile } = useAuth()
  const [profile, setProfile] = useState<Profile>({ name: "", email: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    try {
      setLoading(true)
      // Use auth context data instead of API call for now
      if (user) {
        setProfile({
          id: user.id,
          name: user.name || "",
          email: user.email || "",
          avatar_url: "",
          language: 'en'
        })
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const save = async () => {
    setSaving(true)
    setSaved(false)
    setError("")
    
    // Basic validation
    if (!profile.name.trim()) {
      setError("Name is required")
      setSaving(false)
      return
    }
    
    if (!profile.email.trim()) {
      setError("Email is required")
      setSaving(false)
      return
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(profile.email.trim())) {
      setError("Please enter a valid email address")
      setSaving(false)
      return
    }
    
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save profile')
      }

      // Update AuthContext with new profile data
      updateProfile(data.user?.name || profile.name, data.user?.email || profile.email)

      // Persist to auth storage so the whole app reflects the new email/name
      const stored = localStorage.getItem('auth_user')
      if (stored) {
        const current = JSON.parse(stored)
        const updated = { ...current, name: data.user?.name || profile.name, email: data.user?.email || profile.email }
        localStorage.setItem('auth_user', JSON.stringify(updated))
      }

      await load()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Save profile error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally { 
      setSaving(false) 
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Profile and account</h1>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Profile Information */}
            <div className="bg-white border border-gray-200 rounded-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="text-sm font-medium text-gray-900">Profile information</div>
                <div className="text-sm text-gray-500">This information will be displayed publicly</div>
              </div>

              <div className="p-6 space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Success Message */}
                {saved && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <p className="text-sm text-green-600">Profile updated successfully!</p>
                  </div>
                )}

                {/* Avatar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile picture</label>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200" />
                    <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Upload</button>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  />
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Personal Language</label>
                  <select
                    value={profile.language}
                    onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  >
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>

                {/* Update Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Update password</label>
                  <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md">
                    <div>
                      <p className="text-sm text-gray-600">Follow the recovery process to change your password.</p>
                    </div>
                    <Link
                      href="/settings/change-password"
                      className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Update password
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={save}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Admin Storage Widget */}
            {user?.role === 'admin' && (
              <div>
                <MongoDBStorageWidget />
              </div>
            )}
          </div>

          {/* Placeholder tabs */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="p-4 border border-dashed rounded text-gray-400 text-sm">Notification preferences (coming soon)</div>
            <div className="p-4 border border-dashed rounded text-gray-400 text-sm">Subscription (coming soon)</div>
            <div className="p-4 border border-dashed rounded text-gray-400 text-sm">Security (coming soon)</div>
          </div>
        </div>
      </div>
    </div>
  )
}
