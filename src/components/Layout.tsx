"use client"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/contexts/AuthContext"
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  UserCheck,
  Receipt,
  Settings,
  ChevronDown,
  LogOut,
  User,
  Shield,
  Menu,
  X
} from "lucide-react"

const getSidebarItems = (userRole: string) => {
  const adminItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Requests", href: "/requests", icon: FileText },
    { name: "Clients", href: "/clients", icon: Users },
    { name: "Team", href: "/team", icon: UserCheck },
    { name: "Invoices", href: "/invoices", icon: Receipt },
    { name: "Reports", href: "/reports", icon: LayoutDashboard },
    { name: "Settings", href: "/settings/profile-and-account", icon: Settings },
  ]

  const clientItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "My Requests", href: "/requests", icon: FileText },
    { name: "Invoices", href: "/invoices", icon: Receipt },
    { name: "Settings", href: "/settings/profile-and-account", icon: Settings },
  ]

  return userRole === 'admin' ? adminItems : clientItems
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading, impersonating, logout, stopImpersonation } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" />
      )}

      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <img src="/aneeverse-logo.svg" alt="Aneeverse Logo" className="w-6 h-6" />
            </div>
            <span className="font-semibold text-gray-900 text-base">AneeRequests</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <X size={20} />
          </button>
        </div>

        {/* Desktop Logo */}
        <div className="hidden lg:block p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <img src="/aneeverse-logo.svg" alt="Aneeverse Logo" className="w-6 h-6" />
            </div>
            <span className="font-semibold text-gray-900 text-base">AneeRequests</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {getSidebarItems(user?.role || 'client').map((item: { name: string; href: string; icon: React.ComponentType<{ size: number }> }) => {
              const isActive = pathname === item.href || 
                (item.href !== "/" && pathname?.startsWith(item.href))
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary-50 text-primary-700"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon size={18} />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom Section - Admin User Account */}
        <div className="p-4 border-t border-gray-200">
          <div 
            ref={userMenuRef}
            className="relative"
          >
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-3 py-2 text-sm w-full hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-900 text-sm">{user?.name}</div>
                <div className="text-xs text-gray-500">{user?.email}</div>
                {impersonating && (
                  <div className="text-xs text-orange-600 font-medium">Impersonating</div>
                )}
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                <div className="px-3 py-2 border-b border-gray-100">
                  <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                  {user?.role === 'admin' && (
                    <div className="flex items-center gap-1 mt-1">
                      <Shield size={12} className="text-primary-600" />
                      <span className="text-xs text-primary-600 font-medium">Admin</span>
                    </div>
                  )}
                  {user?.role === 'client' && (
                    <div className="flex items-center gap-1 mt-1">
                      <User size={12} className="text-blue-600" />
                      <span className="text-xs text-blue-600 font-medium">Client</span>
                    </div>
                  )}
                </div>
                
                {impersonating && (
                  <button
                    onClick={() => {
                      stopImpersonation()
                      setShowUserMenu(false)
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-orange-600 hover:bg-orange-50"
                  >
                    <Shield size={14} />
                    Leave impersonation
                  </button>
                )}
                
                <Link
                  href="/settings/profile-and-account"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <User size={14} />
                  Your Profile
                </Link>
                
                <button
                  onClick={() => {
                    logout()
                    setShowUserMenu(false)
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">β</span>
            </div>
            <span className="font-semibold text-gray-900 text-base">AneeRequests</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
