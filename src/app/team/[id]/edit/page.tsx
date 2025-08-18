"use client"
import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import RouteGuard from "@/components/RouteGuard"

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  status: string
  can_view_client_portal?: boolean
  created_at: string
}

export default function EditTeamMemberPage() {
  const params = useParams()
  const router = useRouter()
  const memberId = params.id as string
  
  const [member, setMember] = useState<TeamMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "member",
    status: "active",
    can_view_client_portal: false,
    password: ""
  })

  const loadMember = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/team/${memberId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch team member')
      }
      
      const memberData = await response.json()
      setMember(memberData)
      setFormData({
        name: memberData.name,
        email: memberData.email,
        role: memberData.role,
        status: memberData.status,
        can_view_client_portal: Boolean(memberData.can_view_client_portal),
        password: ""
      })
    } catch (err) {
      console.error('Error loading team member:', err)
      setError('Failed to load team member')
    } finally {
      setLoading(false)
    }
  }, [memberId])

  useEffect(() => {
    loadMember()
  }, [loadMember])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.email.trim()) {
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update team member')
      }
      
      // Success - redirect to member detail page
      router.push(`/team/${memberId}`)
    } catch (err) {
      console.error('Error updating team member:', err)
      alert(err instanceof Error ? err.message : 'Failed to update team member')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <RouteGuard requireAdmin>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading...</div>
        </div>
      </RouteGuard>
    )
  }

  if (error || !member) {
    return (
      <RouteGuard requireAdmin>
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500">{error || 'Team member not found'}</div>
        </div>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard requireAdmin>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link
                href={`/team/${memberId}`}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Edit Team Member</h1>
            </div>
          </div>

          {/* Settings: Team Member Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Team Member Information</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="member">Regular team member</option>
                    <option value="admin">Portal Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Change Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                  >
                    Open Change Password
                  </button>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.can_view_client_portal}
                      onChange={(e) => setFormData({ ...formData, can_view_client_portal: e.target.checked })}
                      className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                    />
                    Allow this team member to view the client portal
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <Link
                  href={`/team/${memberId}`}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Account Security */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Account Security</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Account Status</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${formData.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-700 capitalize">{formData.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-600">Enable additional security for team member account</p>
                </div>
                <button className="px-3 py-1 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100">
                  Enable 2FA
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-lg border border-red-200 p-6 mt-6">
            <h2 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-red-900 mb-2">Delete Team Member</h3>
                <p className="text-sm text-red-700 mb-4">Permanently delete this team member and all associated data. This action cannot be undone.</p>
                <button onClick={() => {
                  if (confirm('Are you sure you want to delete this team member?')) {
                    fetch(`/api/team/${memberId}`, { method: 'DELETE' })
                      .then(() => router.push('/team'))
                      .catch(() => alert('Failed to delete team member'))
                  }
                }} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Delete Team Member</button>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Team Member Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                        placeholder="Enter new password"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowPasswordModal(false)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                  <button onClick={async () => {
                    if (!newPassword.trim()) return
                    try {
                      const resp = await fetch(`/api/team/${memberId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, password: newPassword }) })
                      if (!resp.ok) throw new Error('Failed to change password')
                      setShowPasswordModal(false)
                      setNewPassword('')
                      alert('Password changed successfully')
                    } catch { alert('Failed to change password') }
                  }} disabled={!newPassword.trim()} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50">Change Password</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  )
}
