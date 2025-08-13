"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/contexts/AuthContext"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  
  // Password reset states
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [emailExists, setEmailExists] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [resetMessage, setResetMessage] = useState("")
  const [resettingPassword, setResettingPassword] = useState(false)
  
  // Password reset form states
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields")
      return
    }
    
    const result = await login(formData)
    
    if (result.success) {
      router.push("/")
    } else {
      setError(result.message)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setCheckingEmail(true)
    setResetMessage("")

    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.exists) {
          setEmailExists(true)
          setResetMessage(data.message)
        } else {
          setResetMessage(data.message)
        }
      } else {
        setResetMessage(data.error || 'An error occurred')
      }
    } catch {
      setResetMessage("An error occurred. Please try again.")
    } finally {
      setCheckingEmail(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResettingPassword(true)
    setResetMessage("")

    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      setResetMessage("All fields are required")
      setResettingPassword(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setResetMessage("New passwords do not match")
      setResettingPassword(false)
      return
    }

    if (newPassword.length < 6) {
      setResetMessage("New password must be at least 6 characters long")
      setResettingPassword(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password-with-old', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: forgotPasswordEmail,
          oldPassword,
          newPassword,
          confirmPassword
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResetMessage(data.message)
        // Reset form
        setOldPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setEmailExists(false)
        setForgotPasswordEmail("")
        // Close reset form after 3 seconds
        setTimeout(() => {
          setShowForgotPassword(false)
          setResetMessage("")
        }, 3000)
      } else {
        setResetMessage(data.error || 'Failed to reset password')
      }
    } catch {
      setResetMessage("An error occurred. Please try again.")
    } finally {
      setResettingPassword(false)
    }
  }

  const resetForgotPasswordForm = () => {
    setShowForgotPassword(false)
    setForgotPasswordEmail("")
    setEmailExists(false)
    setResetMessage("")
    setOldPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">A</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to AneeRequests
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your credentials to access your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {showForgotPassword ? (
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reset Password</h3>
            
            {resetMessage && (
              <div className={`mb-4 p-3 rounded-md text-sm ${
                resetMessage.includes('successfully') || resetMessage.includes('found')
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {resetMessage}
              </div>
            )}

            {!emailExists ? (
              // Step 1: Enter email to check if it exists
              <form onSubmit={handleCheckEmail} className="space-y-4">
                <div>
                  <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    id="resetEmail"
                    type="email"
                    required
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={checkingEmail}
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  >
                    {checkingEmail ? "Checking..." : "Check Email"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForgotPasswordForm}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              // Step 2: Enter old password and new password
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="oldPassword"
                      type={showOldPassword ? "text" : "password"}
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showOldPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={resettingPassword}
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  >
                    {resettingPassword ? "Updating..." : "Update Password"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForgotPasswordForm}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="Enter your password"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
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

            {/* Demo Credentials */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Demo Credentials:</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Admin:</strong> 4d.x.art@gmail.com / Ahmad@Andy@786</p>
                <p><strong>Client:</strong> Login with credentials created by admin</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/setup-admin', { method: 'POST' })
                    const data = await response.json()
                    if (response.ok) {
                      alert('Admin user setup successfully!')
                    } else {
                      alert('Error: ' + data.error)
                    }
                  } catch {
                    alert('Error setting up admin user')
                  }
                }}
                className="mt-2 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
              >
                Setup Admin User
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="font-medium text-purple-600 hover:text-purple-500"
                >
                  Forgot your password?
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>


          </form>
        </div>
        )}
      </div>
    </div>
  )
}
