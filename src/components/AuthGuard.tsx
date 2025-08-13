"use client"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
    
    if (!isLoading && isAuthenticated && requireAdmin && user?.role !== 'admin') {
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
    return null
  }

  return <>{children}</>
}
