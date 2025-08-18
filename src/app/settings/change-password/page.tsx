"use client"
import { useState } from "react"

import { useAuth } from "@/lib/contexts/AuthContext"
import { ArrowLeft, Eye, EyeOff, Lock, Mail, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

export default function ChangePasswordPage() {

  const { changePassword, requestPasswordReset, adminSendTemporaryPassword, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  // Forgot password (send reset link)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMessage, setForgotMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [tempPasswordInfo, setTempPasswordInfo] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError("Please fill in all fields")
      return
    }
    
    setLoading(true)
    
    try {
      const result = await changePassword(formData)
      
      if (result.success) {
        setSuccess(result.message)
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
      } else {
        setError(result.message)
      }
    } catch {
      setError("An error occurred while changing password")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotMessage(null)
    setTempPasswordInfo(null)
    if (!forgotEmail) {
      setForgotMessage({ type: "error", text: "Please enter an email address" })
      return
    }
    try {
      setForgotLoading(true)
      // If admin, also allow sending a temporary password immediately
      if (user?.role === 'admin') {
        const res = await adminSendTemporaryPassword(forgotEmail)
        if (res.success) {
          setForgotMessage({ type: 'success', text: res.message })
          if (res.tempPassword) {
            setTempPasswordInfo(`Temporary password: ${res.tempPassword}`)
          }
        } else {
          setForgotMessage({ type: 'error', text: res.message })
        }
      } else {
        const result = await requestPasswordReset(forgotEmail)
        if ((result as { success?: boolean; message?: string })?.success === false) {
          setForgotMessage({ type: "error", text: (result as { message?: string }).message || "Failed to send reset email" })
        } else {
          setForgotMessage({ type: "success", text: (result as { message?: string })?.message || "Password reset email sent (check console if email is not configured)." })
        }
      }
    } catch {
      setForgotMessage({ type: "error", text: "Failed to send reset email" })
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link 
            href="/settings/profile-and-account"
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Change Password</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="max-w-2xl">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Update Password</h2>
              <p className="text-sm text-gray-600">
                Enter your current password and choose a new password to update your account security.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Password */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    className="w-full pl-10 pr-10 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    className="w-full pl-10 pr-10 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500">Password must be at least 6 characters long</p>
              </div>

              {/* Confirm New Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full pl-10 pr-10 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <Link
                  href="/settings/profile-and-account"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Forgot password block */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-md font-medium text-gray-900">Forgot your current password?</h3>
                <p className="text-sm text-gray-600">Send a password reset link to your email.</p>
              </div>
              <button
                onClick={() => setShowForgot(!showForgot)}
                className="px-3 py-2 text-sm font-medium text-purple-600 hover:text-purple-700"
              >
                {showForgot ? 'Hide' : 'Send reset link'}
              </button>
            </div>

            {showForgot && (
              <form onSubmit={handleForgotSubmit} className="mt-4 space-y-4">
                {forgotMessage && (
                  <div className={`${forgotMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} border rounded-md p-3 text-sm flex items-center gap-2`}>
                    {forgotMessage.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    <span>{forgotMessage.text}</span>
                  </div>
                )}
                {tempPasswordInfo && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-3 text-sm">
                    {tempPasswordInfo}
                  </div>
                )}
                <div>
                  <label htmlFor="forgotEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="forgotEmail"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="your-email@example.com"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowForgot(false); setForgotMessage(null); setForgotEmail(""); setTempPasswordInfo(null) }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Email'}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Note: If email is not configured, the reset URL will be logged in the server console.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
