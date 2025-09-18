"use client"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { canAccessRoute, hasPermission, Permission } from "@/lib/permissions"

interface RouteGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requirePermission?: Permission
  requireAnyPermission?: Permission[]
}

export default function RouteGuard({ 
  children, 
  requireAdmin = false, 
  requirePermission,
  requireAnyPermission 
}: RouteGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Check if user can access the current route
      if (!canAccessRoute(user, pathname)) {
        router.push('/')
        return
      }

      // Check admin requirement
      if (requireAdmin && user.role !== 'admin' && user.role !== 'portal_admin') {
        router.push('/')
        return
      }

      // Check specific permission requirement
      if (requirePermission && !hasPermission(user, requirePermission)) {
        router.push('/')
        return
      }

      // Check any permission requirement
      if (requireAnyPermission && !requireAnyPermission.some(permission => hasPermission(user, permission))) {
        router.push('/')
        return
      }
    }
  }, [isAuthenticated, isLoading, user, requireAdmin, requirePermission, requireAnyPermission, pathname, router])

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

  // Check access permissions
  if (user && !canAccessRoute(user, pathname)) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Access Denied</div>
          <div className="text-gray-600 mb-4">You don&apos;t have permission to access this page.</div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Check admin requirement
  if (requireAdmin && user && user.role !== 'admin' && user.role !== 'portal_admin') {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Access Denied</div>
          <div className="text-gray-600 mb-4">Admin access required for this page.</div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Check specific permission requirement
  if (requirePermission && !hasPermission(user, requirePermission)) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Access Denied</div>
          <div className="text-gray-600 mb-4">You don&apos;t have the required permission for this page.</div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Check any permission requirement
  if (requireAnyPermission && !requireAnyPermission.some(permission => hasPermission(user, permission))) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Access Denied</div>
          <div className="text-gray-600 mb-4">You don&apos;t have the required permissions for this page.</div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
