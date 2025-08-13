"use client"
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link')
      return
    }

    verifyEmail()
  }, [token])

  const verifyEmail = async () => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('Email verified successfully! You can now log in to your account.')
      } else {
        setStatus('error')
        setMessage(data.error || 'Email verification failed')
      }
    } catch {
      setStatus('error')
      setMessage('An error occurred during verification')
    }
  }

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />
      case 'error':
        return <XCircle className="w-12 h-12 text-red-500" />
    }
  }

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Verifying your email...'
      case 'success':
        return 'Email Verified!'
      case 'error':
        return 'Verification Failed'
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
          {status === 'success' && (
            <button
              onClick={() => router.push('/login')}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Go to Login
            </button>
          )}
          
          {status === 'error' && (
            <div className="space-y-3">
              <button
                onClick={() => router.push('/login')}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Go to Login
              </button>
              <button
                onClick={() => router.push('/register')}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
