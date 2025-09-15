"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Filter, List, Plus, Bell, ChevronDown, X, Search, Calendar } from "lucide-react"
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

interface FilterState {
  search: string
  client: string
  organization: string
  assignedTo: string
  status: string
  priority: string
  dueDate: string
  createdDate: string
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
  
  // When impersonating, show admin interface but with client's data
  const [recentRequests, setRecentRequests] = useState<Request[]>([])
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([])
  const [activeTab, setActiveTab] = useState<'open' | 'all' | 'unassigned' | 'completed'>('open')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string; email: string }[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    client: '',
    organization: '',
    assignedTo: '',
    status: '',
    priority: '',
    dueDate: '',
    createdDate: ''
  })

  // Helper function to get member name
  const getMemberName = useCallback((id?: string) => {
    if (!id) return undefined
    const m = teamMembers.find(tm => tm.id === id)
    return m?.name || m?.email
  }, [teamMembers])

  // Filter requests based on active tab and filters
  const filterRequests = useCallback(() => {
    let filtered = recentRequests

    // First apply tab filtering
    if (activeTab === 'open') {
      filtered = filtered.filter(req => req.status !== 'completed' && req.status !== 'closed')
    } else if (activeTab === 'unassigned') {
      filtered = filtered.filter(req => !req.assigned_to)
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(req => req.status === 'completed' || req.status === 'closed')
    }
    // 'all' tab shows all requests

    // Apply search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim()
      filtered = filtered.filter(req => 
        req.title.toLowerCase().includes(searchTerm) ||
        (req.description && req.description.toLowerCase().includes(searchTerm)) ||
        req.client?.name.toLowerCase().includes(searchTerm) ||
        getMemberName(req.assigned_to)?.toLowerCase().includes(searchTerm)
      )
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(req => req.status === filters.status)
    }

    // Apply priority filter
    if (filters.priority) {
      filtered = filtered.filter(req => req.priority === filters.priority)
    }

    // Apply due date filter
    if (filters.dueDate) {
      const dueDate = new Date(filters.dueDate)
      filtered = filtered.filter(req => {
        if (!req.due_date) return false
        const requestDueDate = new Date(req.due_date)
        return requestDueDate.toDateString() === dueDate.toDateString()
      })
    }

    // Apply created date filter
    if (filters.createdDate) {
      const createdDate = new Date(filters.createdDate)
      filtered = filtered.filter(req => {
        const requestCreatedDate = new Date(req.created_at)
        return requestCreatedDate.toDateString() === createdDate.toDateString()
      })
    }

    setFilteredRequests(filtered)
  }, [recentRequests, activeTab, filters, getMemberName])

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const isImpersonating = (user?.id || '').startsWith('impersonated-')
      const isImpersonatingTeamMember = (user?.id || '').startsWith('impersonated-team-')
      const effectiveRole = isImpersonatingTeamMember ? user?.role : (isImpersonating ? 'admin' : user?.role)
      
      console.log('Dashboard load - User:', user, 'IsImpersonating:', isImpersonating, 'IsImpersonatingTeamMember:', isImpersonatingTeamMember, 'EffectiveRole:', effectiveRole)
      
      if (user?.role === 'admin' && !isImpersonating) {
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
        const clientId = (user as { clientId?: string })?.clientId
        if (clientId) {
          url = `/api/requests?client_id=${encodeURIComponent(clientId)}`
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
      } else if (isImpersonating && effectiveRole === 'admin') {
        // When impersonating a client, show admin interface but with client's data
        let url = '/api/requests'
        const clientId = (user as { clientId?: string })?.clientId
        if (clientId) {
          url = `/api/requests?client_id=${encodeURIComponent(clientId)}`
        }
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error('Failed to fetch requests data')
        }
        
        const requestsData = await response.json()
        const clientRequests = requestsData.slice(0, 5)
        
        setStats({
          revenue: 0,
          clients: 1, // Just the impersonated client
          requests: clientRequests.length,
          reviews: 0,
          team: 0
        })
        setRecentRequests(clientRequests)
      } else if (user?.role === 'member' || user?.role === 'viewer' || isImpersonatingTeamMember) {
        // Team members: show only their assigned requests
        let url = '/api/requests'
        let memberId = user?.id
        
        // Handle impersonated team members
        if ((user?.id || '').startsWith('impersonated-team-')) {
          memberId = (user?.id || '').replace('impersonated-team-', '')
        }
        
        console.log('Team member dashboard - User ID:', user?.id, 'Member ID:', memberId)
        
        if (memberId) {
          url = `/api/requests?team_member_id=${encodeURIComponent(memberId)}`
        }
        
        console.log('Fetching requests from URL:', url)
        
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch requests data')
        }
        const requestsData = await response.json()
        console.log('Team member requests data:', requestsData)
        
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
  }, [user])

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

  // Apply filters whenever requests, activeTab, or filters change
  useEffect(() => {
    filterRequests()
  }, [filterRequests])

  const clearFilters = () => {
    setFilters({
      search: '',
      client: '',
      organization: '',
      assignedTo: '',
      status: '',
      priority: '',
      dueDate: '',
      createdDate: ''
    })
  }

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== '')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Admin requests layout helpers

  const getStatusStyle = (status: string) => {
    // Normalize the status to handle different formats
    const normalizedStatus = status.toLowerCase().replace(/[_\s]/g, '')
    
    switch (normalizedStatus) {
      case 'submitted': return { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' }
      case 'inprogress': return { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' }
      case 'pendingresponse': return { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' }
      case 'completed': return { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' }
      case 'closed': return { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' }
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' }
    }
  }

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'urgent': return { dot: 'bg-red-600', text: 'text-gray-900', bg: 'bg-red-100' }
      case 'high': return { dot: 'bg-orange-500', text: 'text-gray-900', bg: 'bg-orange-100' }
      case 'medium': return { dot: 'bg-yellow-500', text: 'text-gray-900', bg: 'bg-yellow-100' }
      case 'low': return { dot: 'bg-blue-500', text: 'text-gray-900', bg: 'bg-blue-100' }
      case 'none': return { dot: 'bg-gray-400', text: 'text-gray-900', bg: 'bg-gray-100' }
      default: return { dot: 'bg-gray-400', text: 'text-gray-900', bg: 'bg-gray-100' }
    }
  }

  // Render-friendly preview: strip HTML tags and decode common entities
  const getDescriptionPreview = (value: string | undefined) => {
    if (!value) return ''
    const withoutTags = value.replace(/<[^>]*>/g, ' ')
    const decoded = withoutTags
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
    return decoded.replace(/\s+/g, ' ').trim()
  }

  const isImpersonating = (user?.id || '').startsWith('impersonated-')
  const isImpersonatingTeamMember = (user?.id || '').startsWith('impersonated-team-')
  // When impersonating, show admin interface but with client's data
  const effectiveRole = isImpersonatingTeamMember ? user?.role : (isImpersonating ? 'admin' : user?.role)

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-gray-900">
            Dashboard
          </h1>
          {isImpersonating && (
            <span className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-md">
              Impersonating
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md">
            <Calendar size={16} />
            <span className="hidden sm:inline">10 Jul - 10 Aug</span>
            <span className="sm:hidden">Date Range</span>
            <ChevronDown size={16} />
          </div>
          <button className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
            <Bell size={16} />
          </button>
        </div>
      </div>

      {/* Page Title Section */}
      <div className="px-4 sm:px-6 py-4 bg-white border-b border-gray-200">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
          Welcome, {user?.name || 'User'}
        </h1>
      </div>

      {/* Metrics Grid */}
      <div className="px-4 sm:px-6 py-4 bg-white border-b border-gray-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-4">
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
        <div className="flex items-center justify-center py-4 mb-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-300 rounded-lg mx-auto mb-2" />
            <div className="text-xs font-medium text-gray-500">No revenue for the selected period</div>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="px-4 sm:px-6 py-3 bg-white">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-9 pr-4 py-2 text-xs text-gray-900 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            {filters.search && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 text-xs text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 bg-white shadow-sm ${
                showFilters || hasActiveFilters()
                  ? 'text-primary-700 bg-primary-50 border-primary-200'
                  : ''
              }`}
            >
              <Filter size={16} className={showFilters || hasActiveFilters() ? "text-primary-500" : "text-gray-500"} />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters() && (
                <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
              )}
              <ChevronDown size={12} />
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 bg-white shadow-sm">
              <List size={16} />
              <span className="hidden sm:inline">List</span>
              <ChevronDown size={12} />
            </button>
          </div>
        </div>
        
        {hasActiveFilters() && (
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-xs text-primary-700 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 transition-colors"
            >
              <X size={14} />
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="px-4 sm:px-6 py-2 bg-gray-50 mb-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All statuses</option>
                <option value="submitted">Submitted</option>
                <option value="in_progress">In Progress</option>
                <option value="pending_response">Pending Response</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All priorities</option>
                <option value="none">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Due Date Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={filters.dueDate}
                onChange={(e) => setFilters(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Created Date Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Created Date</label>
              <input
                type="date"
                value={filters.createdDate}
                onChange={(e) => setFilters(prev => ({ ...prev, createdDate: e.target.value }))}
                className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 sm:px-6 bg-white mb-2">
        <div className="flex gap-2 min-w-max">
          <button 
            onClick={() => setActiveTab('open')}
            className={`px-4 py-2 text-xs font-medium ${activeTab === 'open' ? 'text-white bg-primary-600 rounded-md' : 'text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50'} whitespace-nowrap shadow-sm transition-colors`}
          >
            Open
          </button>
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-xs font-medium ${activeTab === 'all' ? 'text-white bg-primary-600 rounded-md' : 'text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50'} whitespace-nowrap shadow-sm transition-colors`}
          >
            All
          </button>
          {effectiveRole === 'admin' && (
            <button 
              onClick={() => setActiveTab('unassigned')}
              className={`px-4 py-2 text-xs font-medium ${activeTab === 'unassigned' ? 'text-white bg-primary-600 rounded-md' : 'text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50'} whitespace-nowrap shadow-sm transition-colors`}
            >
              Unassigned
            </button>
          )}
          <button 
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 text-xs font-medium ${activeTab === 'completed' ? 'text-white bg-primary-600 rounded-md' : 'text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50'} whitespace-nowrap shadow-sm transition-colors`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Desktop Table - aligned with admin Requests layout */}
      <div className="hidden lg:block flex-1 bg-white px-4 sm:px-6 py-6">
        {/* Table Header */}
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
            <div className="col-span-1 flex items-center">
              <input type="checkbox" className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
            </div>
            <div className="col-span-3">TITLE</div>
            {effectiveRole === 'admin' && (
              <div className="col-span-2">CLIENT</div>
            )}
            <div className="col-span-1">STATUS</div>
            {effectiveRole === 'admin' && (
              <div className="col-span-1">ASSIGNED</div>
            )}
            <div className="col-span-1 flex items-center gap-1">
              PRIORITY
              <ChevronDown size={12} className="text-gray-400" />
            </div>
            <div className="col-span-1 flex items-center gap-1">
              UPDATED
              <ChevronDown size={12} className="text-gray-400" />
            </div>
            <div className="col-span-1 flex items-center gap-1">
              DUE DATE
              <ChevronDown size={12} className="text-gray-400" />
            </div>
            <div className="col-span-1 flex items-center gap-1">
              CREATED
              <ChevronDown size={12} className="text-gray-400" />
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
            {!loading && !error && filteredRequests.length === 0 && recentRequests.length === 0 && (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="text-gray-500 mb-4 text-xs">No requests yet</div>
                  <p className="text-xs text-gray-400">Create your first request to get started</p>
                </div>
              </div>
            )}

            {/* Empty State - No Requests Matching Filter */}
            {!loading && !error && filteredRequests.length === 0 && recentRequests.length > 0 && (
              <div className="flex items-center justify-center py-16">
                <div className="text-center max-w-sm">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-gray-50">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {hasActiveFilters() ? 'No matching requests' : 'No requests found'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    {hasActiveFilters() ? (
                      'Try adjusting your search terms or filters to find what you\'re looking for.'
                    ) : (
                      <>
                        {activeTab === 'open' && 'There are no open requests.'}
                        {activeTab === 'unassigned' && 'There are no unassigned requests.'}
                        {activeTab === 'completed' && 'There are no completed requests.'}
                        {activeTab === 'all' && 'There are no requests in this view.'}
                      </>
                    )}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    {hasActiveFilters() && (
                      <button
                        onClick={clearFilters}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
                      >
                        <X size={14} />
                        Clear filters
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab('all')}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      View all requests
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Table Rows */}
            {!loading && !error && filteredRequests.map((request) => (
              <div 
                key={request.id}
                className="grid grid-cols-12 gap-4 px-4 py-4 text-xs border-b border-gray-200 hover:bg-gray-50 last:border-b-0"
              >
                <div className="col-span-1 flex items-center">
                  <input type="checkbox" className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                </div>
                <div className="col-span-3">
                  <Link 
                    href={`/requests/${request.id}`}
                    className="font-medium text-gray-900 hover:text-primary-700 transition-colors"
                  >
                    {request.title || 'Untitled Request'}
                  </Link>
                  <div className="text-gray-500 mt-1 line-clamp-1">
                    {getDescriptionPreview(request.description) || 'No description'}
                  </div>
                </div>
                {effectiveRole === 'admin' && (
                  <div className="col-span-2">
                    <div className="font-medium text-gray-900">{request.client?.name || 'Unknown Client'}</div>
                    <div className="text-gray-500">{/* organization if available */}</div>
                  </div>
                )}
                <div className="col-span-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusStyle(request.status).bg} ${getStatusStyle(request.status).text}`}>
                    {request.status ? request.status.replace(/_/g, ' ') : 'Unknown'}
                  </span>
                </div>
                {effectiveRole === 'admin' && (
                  <div className="col-span-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                      <span className="text-gray-600 text-xs" title={getMemberName(request.assigned_to) || 'Unassigned'}>
                        {getMemberName(request.assigned_to) || 'None'}
                      </span>
                    </div>
                  </div>
                )}
                <div className="col-span-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getPriorityStyle(request.priority).dot}`}></div>
                    <span className={`text-xs font-medium capitalize ${getPriorityStyle(request.priority).text}`}>{request.priority || 'None'}</span>
                  </div>
                </div>
                <div className="col-span-1 text-gray-500 text-xs">
                  {request.updated_at ? formatDate(request.updated_at) : formatDate(request.created_at)}
                </div>
                <div className="col-span-1">
                  <span className="text-gray-500 text-xs">{request.due_date ? formatDate(request.due_date) : 'Due Date'}</span>
                </div>
                <div className="col-span-1 text-gray-500 text-xs">
                  {request.created_at ? formatDate(request.created_at) : 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden flex-1 bg-white px-4 sm:px-6 py-6">
        {!loading && !error && filteredRequests.map((request) => (
          <div 
            key={request.id}
            className="block p-4 border border-gray-200 rounded-md hover:bg-gray-50 bg-white shadow-sm mb-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <Link 
                  href={`/requests/${request.id}`}
                  className="font-medium text-gray-900 text-xs mb-1 truncate hover:text-primary-700 transition-colors block"
                >
                  {request.title || 'Untitled Request'}
                </Link>
                <p className="text-gray-500 text-xs">{getDescriptionPreview(request.description) || 'No description'}</p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <input type="checkbox" className="w-4 h-4 text-primary-600 border-gray-300 rounded" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              {effectiveRole === 'admin' && (
                <div>
                  <div className="text-gray-500 text-xs font-medium mb-1">CLIENT</div>
                  <div className="font-medium text-gray-900 text-xs">{request.client?.name || 'Unknown Client'}</div>
                  <div className="text-gray-500 text-xs"></div>
                </div>
              )}
              
              <div>
                <div className="text-gray-500 text-xs font-medium mb-1">STATUS</div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusStyle(request.status).bg} ${getStatusStyle(request.status).text}`}>
                    {request.status ? request.status.replace(/_/g, ' ') : 'Unknown'}
                  </span>
                </div>
              </div>

              {effectiveRole === 'admin' && (
                <div>
                  <div className="text-gray-500 text-xs font-medium mb-1">ASSIGNED TO</div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                    <span className="text-gray-600 text-xs">{getMemberName(request.assigned_to) || 'None'}</span>
                  </div>
                </div>
              )}

              <div>
                <div className="text-gray-500 text-xs font-medium mb-1">PRIORITY</div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getPriorityStyle(request.priority).dot}`}></div>
                  <span className={`text-xs font-medium capitalize ${getPriorityStyle(request.priority).text}`}>{request.priority || 'None'}</span>
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
          </div>
        ))}
      </div>

      {/* Footer */}
      {!loading && !error && filteredRequests.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-200 mt-4 gap-3 px-4 py-3 bg-white">
          <div className="text-xs text-gray-500 text-center sm:text-left">
            {filteredRequests.length === 0 ? (
              'No results found'
            ) : (
              `Showing ${filteredRequests.length} of ${recentRequests.length} request${recentRequests.length !== 1 ? 's' : ''}`
            )}
            {hasActiveFilters() && (
              <span className="ml-2 text-primary-600">
                (filtered)
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-gray-500">Rows per page</span>
              <select className="text-xs border border-gray-200 rounded px-2 py-1 bg-white">
                <option>15</option>
                <option>25</option>
                <option>50</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}