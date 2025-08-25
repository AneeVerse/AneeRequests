"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Calendar, ChevronDown } from "lucide-react"
import { useAuth } from "@/lib/contexts/AuthContext"
import Link from "next/link"

interface DashboardStats {
  revenue: number
  clients: number
  requests: number
  reviews: number
  team: number
}

interface Request {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  client: {
    name: string
  }
  created_at: string
  updated_at?: string
  due_date?: string
  assigned_to?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    revenue: 0,
    clients: 0,
    requests: 0,
    reviews: 0,
    team: 0
  })
  const [recentRequests, setRecentRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string; email: string }[]>([])

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (user?.role === 'admin') {
        // Admin sees all data
        const response = await fetch('/api/dashboard/stats')
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }
        
        const data = await response.json()
        console.log('Dashboard data:', data) // Debug log
        setStats(data.stats)
        setRecentRequests(data.recentRequests || [])
      } else if (user?.role === 'client') {
        // Client sees only their own requests
        let url = '/api/requests'
        if ((user as { clientId?: string })?.clientId) {
          url = `/api/requests?client_id=${encodeURIComponent((user as { clientId: string }).clientId)}`
        }
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error('Failed to fetch requests data')
        }
        
        const requestsData = await response.json()
        const clientRequests = requestsData.slice(0, 5)
        
        setStats({
          revenue: 0,
          clients: 1, // Just themselves
          requests: clientRequests.length,
          reviews: 0,
          team: 0
        })
        setRecentRequests(clientRequests)
      } else if (user?.role === 'member' || user?.role === 'viewer') {
        // Team members: show only their assigned requests
        let url = '/api/requests'
        let memberId = user?.id
        
        // Handle impersonated team members
        if ((user?.id || '').startsWith('impersonated-team-')) {
          memberId = (user?.id || '').replace('impersonated-team-', '')
        }
        
        if (memberId) {
          url = `/api/requests?team_member_id=${encodeURIComponent(memberId)}`
        }
        
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch requests data')
        }
        const requestsData = await response.json()
        const assigned = requestsData
        setStats({
          revenue: 0,
          clients: 0,
          requests: assigned.length,
          reviews: 0,
          team: 0
        })
        setRecentRequests(assigned)
      } else {
        // Fallback for any other roles
        setStats({
          revenue: 0,
          clients: 0,
          requests: 0,
          reviews: 0,
          team: 0
        })
        setRecentRequests([])
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [user?.role, user?.id])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData()
    }
  }, [isAuthenticated, isLoading, router, loadDashboardData])

  // Fetch team members to resolve assigned_to names
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const res = await fetch('/api/team')
        if (res.ok) {
          const data = await res.json()
          setTeamMembers(data)
        }
      } catch {}
    }
    loadMembers()
  }, [])

  const getMemberName = (id?: string) => {
    if (!id) return undefined
    const m = teamMembers.find(tm => tm.id === id)
    return m?.name || m?.email
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'text-blue-600'
      case 'in_progress': return 'text-yellow-600'
              case 'in_review': return 'text-primary-600'
      case 'completed': return 'text-green-600'
      case 'cancelled': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-400'
    }
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-500'
      case 'in_progress': return 'bg-yellow-500'
      case 'in_review': return 'bg-primary-500'
      case 'completed': return 'bg-green-500'
      case 'cancelled': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 gap-3">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
          Welcome, {user?.name || 'User'}
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md">
            <Calendar size={16} />
            <span className="hidden sm:inline">10 Jul - 10 Aug</span>
            <span className="sm:hidden">Date Range</span>
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Metrics Grid */}
        <div className="px-4 sm:px-6 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">REVENUE</div>
            <div className="text-2xl font-semibold text-gray-900">
              {loading ? "Loading..." : `$${stats.revenue.toFixed(2)}`}
            </div>
            <div className="text-xs text-gray-400">—</div>
            <div className="w-full h-1 bg-gray-100 rounded">
              <div className="h-1 bg-primary-600 rounded" style={{ width: '0%' }}></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {user?.role === 'admin' ? 'CLIENTS' : 'PROJECTS'}
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {loading ? "Loading..." : stats.clients}
            </div>
            <div className="text-xs text-gray-400">—</div>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {user?.role === 'admin' ? 'REQUESTS' : 'MY REQUESTS'}
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {loading ? "Loading..." : stats.requests}
            </div>
            <div className="text-xs text-gray-400">—</div>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">REVIEWS</div>
            <div className="text-2xl font-semibold text-gray-900">
              {loading ? "Loading..." : stats.reviews}
            </div>
            <div className="text-xs text-gray-400">—</div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="flex items-center justify-center py-16 mb-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-300 rounded-lg mx-auto mb-4" />
            <div className="text-xs font-medium text-gray-500">No revenue for the selected period</div>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm"
            />
            <div className="absolute left-3 top-2.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 bg-white shadow-sm">
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
              Filters
              <ChevronDown size={12} />
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 bg-white shadow-sm">
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              List
              <ChevronDown size={12} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <button className="px-4 py-2 text-xs font-medium text-white bg-primary-600 rounded-md whitespace-nowrap shadow-sm">
              Open
            </button>
            <button className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 whitespace-nowrap shadow-sm">
              All
            </button>
            <button className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 whitespace-nowrap shadow-sm">
              Unassigned
            </button>
            <button className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 whitespace-nowrap shadow-sm">
              Completed
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block border border-gray-200 rounded-md overflow-hidden">
          {/* Table Headers */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
            <div className="col-span-1 flex items-center">
              <input type="checkbox" className="w-4 h-4 text-primary-600 border-gray-300 rounded" />
            </div>
            <div className="col-span-3">TITLE</div>
            <div className="col-span-2">CLIENT</div>
            <div className="col-span-1">STATUS</div>
            <div className="col-span-1">ASSIGNED TO</div>
            <div className="col-span-1 flex items-center gap-1">
              PRIORITY
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </div>
            <div className="col-span-1 flex items-center gap-1">
              UPDATED
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </div>
            <div className="col-span-1 flex items-center gap-1">
              DUE DATE
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </div>
            <div className="col-span-1 flex items-center gap-1">
              CREATED
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </div>
          </div>

          {/* Table Body */}
          <div>
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="text-gray-500 text-xs">Loading requests...</div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex items-center justify-center py-16">
                <div className="text-red-600 text-xs">{error}</div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && recentRequests.length === 0 && (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="text-gray-500 mb-4 text-xs">No requests yet</div>
                  <p className="text-xs text-gray-400">Create your first client to get started with requests</p>
                </div>
              </div>
            )}

            {/* Desktop Table Rows */}
            {!loading && !error && recentRequests.map((request) => (
              <Link 
                key={request.id}
                href={`/requests/${request.id}`}
                className="grid grid-cols-12 gap-4 px-4 py-4 text-xs border-b border-gray-200 hover:bg-gray-50 cursor-pointer last:border-b-0"
              >
                <div className="col-span-1 flex items-center">
                  <input type="checkbox" className="w-4 h-4 text-primary-600 border-gray-300 rounded" />
                </div>
                <div className="col-span-3">
                  <div className="font-medium text-gray-900">{request.title || 'Untitled Request'}</div>
                  <div className="text-gray-500 text-xs mt-1">
                    {request.description ? request.description.substring(0, 50) + '...' : 'No description'}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="font-medium text-gray-900">{request.client?.name || 'Unknown Client'}</div>
                  <div className="text-gray-500 text-xs">Individual</div>
                </div>
                <div className="col-span-1">
                  <span className={`text-xs font-medium capitalize ${getStatusColor(request.status)}`}>
                    {request.status ? request.status.replace('_', ' ') : 'Unknown'}
                  </span>
                </div>
                <div className="col-span-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                    <span className="text-gray-600 text-xs" title={getMemberName(request.assigned_to) || 'Unassigned'}>
                      {getMemberName(request.assigned_to) || 'None'}
                    </span>
                  </div>
                </div>
                <div className="col-span-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(request.priority)}`}></div>
                    <span className="text-gray-500 capitalize text-xs">{request.priority || 'Medium'}</span>
                  </div>
                </div>
                <div className="col-span-1 text-gray-500 text-xs">
                  {request.updated_at ? formatDate(request.updated_at) : formatDate(request.created_at)}
                </div>
                <div className="col-span-1">
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <span>{request.due_date ? formatDate(request.due_date) : 'Due Date'}</span>
                    <ChevronDown size={12} />
                  </div>
                </div>
                <div className="col-span-1 text-gray-500 text-xs">
                  {request.created_at ? formatDate(request.created_at) : 'Unknown'}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {!loading && !error && recentRequests.map((request) => (
            <Link 
              key={request.id}
              href={`/requests/${request.id}`}
              className="block p-4 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer bg-white shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-xs mb-1 truncate">{request.title || 'Untitled Request'}</h3>
                  <p className="text-gray-500 text-xs">{request.description ? request.description.substring(0, 50) + '...' : 'No description'}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <input type="checkbox" className="w-4 h-4 text-primary-600 border-gray-300 rounded" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-gray-500 text-xs font-medium mb-1">CLIENT</div>
                  <div className="font-medium text-gray-900 text-xs">{request.client?.name || 'Unknown Client'}</div>
                  <div className="text-gray-500 text-xs">Individual</div>
                </div>
                
                <div>
                  <div className="text-gray-500 text-xs font-medium mb-1">STATUS</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusBgColor(request.status)}`}></div>
                    <span className={`capitalize font-medium text-xs ${getStatusColor(request.status)}`}>
                      {request.status ? request.status.replace('_', ' ') : 'Unknown'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-gray-500 text-xs font-medium mb-1">ASSIGNED TO</div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                    <span className="text-gray-600 text-xs">{getMemberName(request.assigned_to) || 'None'}</span>
                  </div>
                </div>

                <div>
                  <div className="text-gray-500 text-xs font-medium mb-1">PRIORITY</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(request.priority)}`}></div>
                    <span className="text-gray-500 capitalize text-xs">{request.priority || 'Medium'}</span>
                  </div>
                </div>

                <div>
                  <div className="text-gray-500 text-xs font-medium mb-1">UPDATED</div>
                  <div className="text-gray-900 text-xs">{request.updated_at ? formatDate(request.updated_at) : formatDate(request.created_at)}</div>
                </div>

                <div>
                  <div className="text-gray-500 text-xs font-medium mb-1">DUE DATE</div>
                  <div className="text-gray-900 text-xs">{request.due_date ? formatDate(request.due_date) : 'Not set'}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        {!loading && !error && recentRequests.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-200 mt-4 gap-3">
            <div className="text-xs text-gray-500 text-center sm:text-left">
              Showing {recentRequests.length} of {stats.requests} total requests
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-gray-500">Rows per page</span>
                <select className="text-xs border border-gray-200 rounded px-2 py-1 bg-white">
                  <option>15</option>
                </select>
                <ChevronDown size={12} className="ml-1 text-gray-400" />
              </div>
              <div className="flex items-center gap-1">
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
