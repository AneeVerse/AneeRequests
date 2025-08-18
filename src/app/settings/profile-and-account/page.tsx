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
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile>({ name: "", email: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })
      if (!res.ok) throw new Error('Failed to save')
      const data = await res.json()

      // Persist to auth storage so the whole app reflects the new email/name
      const stored = localStorage.getItem('auth_user')
      if (stored) {
        const current = JSON.parse(stored)
        const updated = { ...current, name: data.user?.name || profile.name, email: data.user?.email || profile.email }
        localStorage.setItem('auth_user', JSON.stringify(updated))
      }

      await load()
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch {}
    finally { setSaving(false) }
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
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                  />
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Personal Language</label>
                  <select
                    value={profile.language}
                    onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
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
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
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
