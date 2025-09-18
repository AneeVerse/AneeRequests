"use client"
import { useAuth } from "@/lib/contexts/AuthContext"
import { hasPermission, hasAnyPermission, hasAllPermissions, Permission } from "@/lib/permissions"

interface PermissionGateProps {
  children: React.ReactNode
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  fallback?: React.ReactNode
}

export default function PermissionGate({ 
  children, 
  permission, 
  permissions, 
  requireAll = false,
  fallback = null 
}: PermissionGateProps) {
  const { user } = useAuth()

  // Check single permission
  if (permission && !hasPermission(user, permission)) {
    return <>{fallback}</>
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(user, permissions)
      : hasAnyPermission(user, permissions)
    
    if (!hasRequiredPermissions) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}
