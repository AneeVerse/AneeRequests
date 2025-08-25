"use client"
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const verifyEmail = useCallback(async () => {
    try {
      setLoading(true)
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')
      
      if (!token) {
        setError('No verification token found')
        return
      }

      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setMessage(data.message || 'Email verified successfully!')
      } else {
        setError(data.error || 'Failed to verify email')
      }
    } catch (err) {
      console.error('Error verifying email:', err)
      setError('Failed to verify email')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    verifyEmail()
  }, [verifyEmail])

  const getIcon = () => {
    switch (loading) {
      case true:
        return <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      case false:
        if (success) {
          return <CheckCircle className="w-12 h-12 text-green-500" />
        } else {
          return <XCircle className="w-12 h-12 text-red-500" />
        }
    }
  }

  const getTitle = () => {
    switch (loading) {
      case true:
        return 'Verifying your email...'
      case false:
        if (success) {
          return 'Email Verified!'
        } else {
          return 'Verification Failed'
        }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {getIcon()}
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {getTitle()}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {message}
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {success && (
            <button
              onClick={() => router.push('/login')}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Go to Login
            </button>
          )}
          
          {error && (
            <div className="space-y-3">
              <button
                onClick={() => router.push('/login')}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Go to Login
              </button>
              <button
                onClick={() => router.push('/register')}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Register New Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
