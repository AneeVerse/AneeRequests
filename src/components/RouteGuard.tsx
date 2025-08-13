"use client"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface RouteGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function RouteGuard({ children, requireAdmin = false }: RouteGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated && requireAdmin && user?.role !== 'admin') {
      // Redirect clients away from admin-only pages
      router.push('/')
    }
  }, [isAuthenticated, isLoading, user, requireAdmin, router])

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (requireAdmin && user?.role !== 'admin') {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Access Denied</div>
          <div className="text-gray-600 mb-4">You don&apos;t have permission to access this page.</div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
