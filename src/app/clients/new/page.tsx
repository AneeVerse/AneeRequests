"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import RouteGuard from "@/components/RouteGuard"

export default function CreateClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    client_company_name: "",
    password: "",
    confirmPassword: ""
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    
    // Validation
    if (!formData.name.trim()) {
      setError("Client name is required")
      return
    }

    if (!formData.email.trim()) {
      setError("Email is required")
      return
    }

    if (!formData.password) {
      setError("Password is required")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/clients/create-with-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create client account')
      }

      const result = await response.json()
      setSuccess(`Client account created successfully! ${result.user.is_verified ? 'The client can now log in.' : 'The client needs to verify their email before logging in.'}`)
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        client_company_name: "",
        password: "",
        confirmPassword: ""
      })

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/clients')
      }, 3000)
      
    } catch (err) {
      console.error('Error creating client account:', err)
      setError(err instanceof Error ? err.message : 'Failed to create client account')
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

  return (
    <RouteGuard requireAdmin>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Link 
              href="/clients"
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Create Client Account</h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Client Information</h2>
                
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Client Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>
                 {/* Company Name */}
                 <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Company/Organization Name
                  </label>
                  <input
                    id="company"
                    type="text"
                    value={formData.client_company_name}
                    onChange={(e) => handleInputChange('client_company_name', e.target.value)}
                    placeholder="ACME Corporation"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                 
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    required
                  />
               
                </div>

               

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff size={16} className="text-gray-400" />
                      ) : (
                        <Eye size={16} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Minimum 6 characters</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirm password"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} className="text-gray-400" />
                      ) : (
                        <Eye size={16} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Success Message */}
                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <p className="text-sm text-green-600">{success}</p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                  <Link
                    href="/clients"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating Account...' : 'Create Client Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}
