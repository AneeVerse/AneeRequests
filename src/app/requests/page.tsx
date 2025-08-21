"use client"
import { useState, useEffect, useCallback } from "react"
import { Filter, List, LayoutGrid, Plus, Bell, BarChart3, ChevronDown, X, Search } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/AuthContext"

interface Client {
  id: string
  name: string
  email?: string
  created_at: string
  client_company?: {
    name: string
  }
}

interface Request {
  id: string
  title: string
  description: string
  status: string
  priority: string
  client_id: string
  created_at: string
  updated_at: string
  due_date?: string
  client?: Client
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

export default function RequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<Request[]>([])
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([])
  const [activeTab, setActiveTab] = useState<'open' | 'all' | 'unassigned' | 'completed'>('open')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<{requestId: string, field: string} | null>(null)
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string; email: string }[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [organizations, setOrganizations] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [filterDataLoading, setFilterDataLoading] = useState(false)
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

  // Filter requests based on active tab and filters
  const filterRequests = useCallback(() => {
    let filtered = requests

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
        req.description.toLowerCase().includes(searchTerm) ||
        req.client?.name.toLowerCase().includes(searchTerm) ||
        req.client?.client_company?.name.toLowerCase().includes(searchTerm) ||
        getMemberName(req.assigned_to)?.toLowerCase().includes(searchTerm)
      )
    }

    // Apply client filter
    if (filters.client) {
      filtered = filtered.filter(req => req.client?.id === filters.client)
    }

    // Apply organization filter
    if (filters.organization) {
      filtered = filtered.filter(req => req.client?.client_company?.name === filters.organization)
    }

    // Apply assigned to filter
    if (filters.assignedTo) {
      filtered = filtered.filter(req => req.assigned_to === filters.assignedTo)
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
  }, [requests, activeTab, filters])

  // Load requests from API
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      let url = '/api/requests'
      
      // If the logged-in user is a team member, restrict to assigned requests
      if (user?.role === 'member' || user?.role === 'viewer') {
        let memberId = user?.id
        
        // Handle impersonated team members
        if ((user?.id || '').startsWith('impersonated-team-')) {
          memberId = (user?.id || '').replace('impersonated-team-', '')
        }
        
        if (memberId) {
          url = `/api/requests?team_member_id=${encodeURIComponent(memberId)}`
        }
      }
      
      // If the logged-in user is a client (including impersonated client), restrict to their requests
      if (user?.role === 'client') {
        let clientId = user?.id
        
        // For impersonated clients, use the clientId property
        if ((user as any)?.clientId) {
          clientId = (user as any).clientId
        }
        
        if (clientId) {
          url = `/api/requests?client_id=${encodeURIComponent(clientId)}`
        }
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch requests')
      }
      
      const data = await response.json()
      setRequests(data)
      // Initial filtering will happen in the useEffect
    } catch (err) {
      console.error('Error loading requests:', err)
      setError('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }, [user?.role, user?.id])

  // Load clients and organizations for filters
  const loadFilterData = useCallback(async () => {
    try {
      setFilterDataLoading(true)
      // Load clients
      const clientsResponse = await fetch('/api/clients')
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json()
        setClients(clientsData)
        
        // Extract unique organizations
        const orgs = Array.from(new Set(clientsData.map((client: Client) => client.client_company?.name).filter((name: string | undefined): name is string => Boolean(name)))) as string[]
        setOrganizations(orgs)
      }
    } catch (err) {
      console.error('Error loading filter data:', err)
    } finally {
      setFilterDataLoading(false)
    }
  }, [])

  const handleFieldUpdate = async (requestId: string, field: string, value: string) => {
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [field]: value
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update ${field}`)
      }

      const updatedRequest = await response.json()
      
      // Update the request in the local state
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId ? { ...req, ...updatedRequest } : req
        )
      )
      
      setEditingField(null)
    } catch (error) {
      console.error(`Error updating ${field}:`, error)
      alert(`Failed to update ${field}`)
    }
  }

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }
      // Escape to close filters
      if (e.key === 'Escape' && showFilters) {
        setShowFilters(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showFilters])

  useEffect(() => {
    loadData()
    loadFilterData()
  }, [loadData, loadFilterData])

  // Prefetch team members for name lookup / tooltip
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

  // Apply filters whenever requests, activeTab, or filters change
  useEffect(() => {
    filterRequests()
  }, [requests, activeTab, filters, filterRequests])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return 'Invalid date'
    }
  }

  const formatDateForInput = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return ''
      }
      return date.toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'submitted': return { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' }
      case 'in_progress': return { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' }
      case 'pending_response': return { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' }
      case 'completed': return { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' }
      case 'closed': return { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' }
      default: return { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' }
    }
  }

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'urgent': return { dot: 'bg-red-500', text: 'text-red-700' }
      case 'high': return { dot: 'bg-orange-500', text: 'text-orange-700' }
      case 'medium': return { dot: 'bg-yellow-500', text: 'text-yellow-700' }
      case 'low': return { dot: 'bg-blue-500', text: 'text-blue-700' }
      default: return { dot: 'bg-gray-400', text: 'text-gray-700' }
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

  const isAdmin = user?.role === 'admin'
  const isClient = user?.role === 'client'
  const canCreateRequest = isAdmin || isClient
  const isImpersonating = (user?.id || '').startsWith('impersonated-')
  const gridColsClass = isAdmin ? 'grid-cols-13' : 'grid-cols-9'

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-gray-900">
            {user?.role === 'client' ? 'My Requests' : 'Requests'}
          </h1>
          {isImpersonating && (
            <span className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-md">
              Impersonating
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canCreateRequest && (
            <Link
              href="/requests/new"
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700 transition-colors"
            >
              <Plus size={16} className="stroke-[2.5]" />
              <span className="hidden sm:inline">Create Request</span>
              <span className="sm:hidden">Create</span>
            </Link>
          )}
          <button className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
            <Bell size={16} />
          </button>
        </div>
      </div>

            {/* Search and Controls */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search requests, clients, descriptions..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-10 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-shadow"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              {filters.search && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {hasActiveFilters() && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors whitespace-nowrap"
              >
                <X size={14} />
                <span className="hidden sm:inline">Clear filters</span>
                <span className="sm:hidden">Clear</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1 px-3 py-2 text-sm font-medium border rounded-md transition-colors ${
                showFilters || hasActiveFilters()
                  ? 'text-violet-700 bg-violet-50 border-violet-200'
                  : 'text-gray-700 bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Filter size={16} className={showFilters || hasActiveFilters() ? "text-violet-500" : "text-gray-500"} />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters() && (
                <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
              )}
              <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors">
              <BarChart3 size={16} />
            </button>
            <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
              <List size={16} />
              <span className="hidden sm:inline">List</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {/* Client Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Client</label>
              <select
                value={filters.client}
                onChange={(e) => setFilters(prev => ({ ...prev, client: e.target.value }))}
                disabled={filterDataLoading}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">
                  {filterDataLoading ? 'Loading...' : 'All clients'}
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Organization Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Organization</label>
              <select
                value={filters.organization}
                onChange={(e) => setFilters(prev => ({ ...prev, organization: e.target.value }))}
                disabled={filterDataLoading}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">
                  {filterDataLoading ? 'Loading...' : 'All organizations'}
                </option>
                {organizations.map((org) => (
                  <option key={org} value={org}>
                    {org}
                  </option>
                ))}
              </select>
            </div>

            {/* Assigned To Filter */}
            {isAdmin && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Assigned To</label>
                <select
                  value={filters.assignedTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="">All members</option>
                  <option value="">Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
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
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="">All priorities</option>
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
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            {/* Created Date Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Created Date</label>
              <input
                type="date"
                value={filters.createdDate}
                onChange={(e) => setFilters(prev => ({ ...prev, createdDate: e.target.value }))}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 bg-white border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <button 
            onClick={() => setActiveTab('open')}
            className={`py-2 px-3 text-sm font-medium whitespace-nowrap ${activeTab === 'open' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'} -mb-px transition-colors`}
          >
            Open
          </button>
          <button 
            onClick={() => setActiveTab('all')}
            className={`py-2 px-3 text-sm font-medium whitespace-nowrap ${activeTab === 'all' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'} -mb-px transition-colors`}
          >
            All
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('unassigned')}
              className={`py-2 px-3 text-sm font-medium whitespace-nowrap ${activeTab === 'unassigned' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'} -mb-px transition-colors`}
            >
              Unassigned
            </button>
          )}
          <button 
            onClick={() => setActiveTab('completed')}
            className={`py-2 px-3 text-sm font-medium whitespace-nowrap ${activeTab === 'completed' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'} -mb-px transition-colors`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block flex-1 bg-white border-b border-gray-200 overflow-x-auto">
        {/* Table Header */}
        <div className={`grid ${gridColsClass} gap-3 px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50/50 border-y border-gray-200 min-w-[800px]`}>
          <div className="col-span-1 flex items-center">
            <input type="checkbox" className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500" />
          </div>
          <div className="col-span-2 flex items-center min-w-[200px]">
            TITLE
            <ChevronDown size={8} className="ml-1 text-gray-400" />
          </div>
          {isAdmin && <div className="col-span-2 flex items-center min-w-[120px] ml-28">
            CLIENT
            <ChevronDown size={8} className="ml-1 text-gray-400" />
          </div>}
          <div className="col-span-2 flex items-center min-w-[120px] ml-18">
            STATUS
            <ChevronDown size={8} className="ml-1 text-gray-400" />
          </div>
          {isAdmin && <div className="col-span-2 flex items-center min-w-[120px] ml-5">
            ASSIGNED TO
            <ChevronDown size={8} className="ml-1 text-gray-400" />
          </div>}
          <div className="col-span-1 flex items-center min-w-[80px]">
            PRIORITY
            <ChevronDown size={8} className="ml-1 text-gray-400" />
          </div>
          <div className="col-span-1 flex items-center min-w-[80px]">
            UPDATED
            <ChevronDown size={8} className="ml-1 text-gray-400" />
          </div>
          <div className="col-span-1 flex items-center min-w-[80px]">
            DUE DATE
            <ChevronDown size={8} className="ml-1 text-gray-400" />
          </div>
          <div className="col-span-1 flex items-center min-w-[80px]">
            CREATED
            <ChevronDown size={8} className="ml-1 text-gray-400" />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-3 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
              <div className="text-sm text-gray-600 font-medium">Loading requests...</div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center h-[400px] px-4">
            <div className="flex flex-col items-center gap-4 text-center max-w-sm mx-auto">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-red-100 text-red-600">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <div className="text-base text-gray-900 font-medium mb-1">Failed to load requests</div>
                <div className="text-sm text-gray-500 mb-4">There was an error loading your requests. Please try again.</div>
              </div>
              <button 
                onClick={loadData}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-violet-700 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredRequests.length === 0 && requests.length === 0 && (
          <div className="flex items-center justify-center h-[400px] px-4">
            <div className="flex flex-col items-center gap-4 text-center max-w-sm mx-auto">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <div className="text-base text-gray-900 font-medium mb-1">
                  {user?.role === 'client' ? 'No requests yet' : 'No requests found'}
                </div>
                <div className="text-sm text-gray-500 mb-4">
                  {user?.role === 'client' 
                    ? 'Create your first request to get started' 
                    : 'Get started by creating your first request'
                  }
                </div>
              </div>
              <Link
                href="/requests/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
              >
                <Plus size={16} className="stroke-[2.5]" />
                {user?.role === 'client' ? 'Create your first request' : 'Create your first request'}
              </Link>
            </div>
          </div>
        )}

        {/* Empty State - No Requests Matching Filter */}
        {!loading && !error && filteredRequests.length === 0 && requests.length > 0 && (
          <div className="flex items-center justify-center py-16 px-4">
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
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
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
            className={`grid ${gridColsClass} gap-3 px-4 py-3 text-sm border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer min-w-[800px] min-h-[40px] items-center`}
          >
            <div className="col-span-1 flex items-center">
              <input type="checkbox" className="w-2.5 h-2.5 text-violet-600 border-gray-300 rounded focus:ring-violet-500" />
            </div>
            <div className="col-span-2 min-w-[200px]">
              <Link href={`/requests/${request.id}`} className="font-medium text-gray-900 mb-0 hover:text-violet-700 text-xs" onClick={(e)=>{ if (editingField?.requestId === request.id) e.preventDefault() }}>{request.title}</Link>
              <div className="text-gray-500 text-xs line-clamp-1">
                {getDescriptionPreview(request.description) || 'No description'}
              </div>
            </div>
            {isAdmin && (
              <div className="col-span-2 min-w-[120px] ml-28">
                <div className="font-medium text-gray-900 text-xs">{request.client?.name || 'Unknown Client'}</div>
                <div className="text-gray-500 text-xs">{request.client?.client_company?.name || ''}</div>
              </div>
            )}
            <div className="col-span-2 flex items-center min-w-[120px] ml-14" onClick={(e) => {
              e.preventDefault()
              setEditingField({requestId: request.id, field: 'status'})
            }}>
              {editingField?.requestId === request.id && editingField?.field === 'status' ? (
                <div className="relative w-full max-w-[150px]">
                  <select 
                    value={request.status}
                    onChange={(e) => {
                      e.preventDefault()
                      handleFieldUpdate(request.id, 'status', e.target.value)
                    }}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    className="w-full text-xs text-gray-900 border border-gray-300 rounded-md py-1.5 pl-2 pr-6 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 capitalize cursor-pointer appearance-none shadow-sm z-10 relative"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="pending_response">Pending Response</option>
                    <option value="completed">Completed</option>
                    <option value="closed">Closed</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 pointer-events-none">
                    <svg className="h-3 w-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 w-full cursor-pointer hover:bg-gray-50 px-1.5 py-0.5 rounded-md transition-colors">
                  <div className={`w-1.5 h-1.5 rounded-full ${getStatusStyle(request.status).dot}`}></div>
                  <span className={`capitalize text-xs font-medium ${getStatusStyle(request.status).text}`}>
                    {request.status.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
            {isAdmin && (
              <div
                className="col-span-2 flex items-center min-w-[120px] ml-5"
                onClick={(e) => {
                  e.preventDefault()
                  setEditingField({ requestId: request.id, field: 'assigned_to' })
                }}
              >
                {editingField?.requestId === request.id && editingField?.field === 'assigned_to' ? (
                  <AssignDropdown
                    requestId={request.id}
                    currentAssignedId={request.assigned_to}
                    onSelect={(memberId) => handleFieldUpdate(request.id, 'assigned_to', memberId)}
                    onClose={() => setEditingField(null)}
                  />
                ) : (
                  <div className="flex items-center gap-1.5 w-full cursor-pointer hover:bg-gray-50 px-1.5 py-0.5 rounded-md transition-colors" title={getMemberName(request.assigned_to) || 'Unassigned'}>
                    <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <span className="text-gray-600 text-xs truncate max-w-[140px]">{getMemberName(request.assigned_to) || 'None'}</span>
                  </div>
                )}
              </div>
            )}
            <div className="col-span-1 flex items-center min-w-[80px]" onClick={(e) => {
              e.preventDefault()
              setEditingField({requestId: request.id, field: 'priority'})
            }}>
              {editingField?.requestId === request.id && editingField?.field === 'priority' ? (
                <div className="relative w-full max-w-[120px]">
                  <select 
                    value={request.priority}
                    onChange={(e) => {
                      e.preventDefault()
                      handleFieldUpdate(request.id, 'priority', e.target.value)
                    }}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    className="w-full text-xs text-gray-900 border border-gray-300 rounded-md py-1 pl-1.5 pr-5 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 capitalize cursor-pointer appearance-none shadow-sm z-10 relative"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                    <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 w-full cursor-pointer hover:bg-gray-50 px-1.5 py-0.5 rounded-md transition-colors">
                  <div className={`w-1.5 h-1.5 rounded-full ${getPriorityStyle(request.priority).dot}`}></div>
                  <span className={`capitalize text-xs font-medium ${getPriorityStyle(request.priority).text}`}>{request.priority}</span>
                </div>
              )}
            </div>
            <div className="col-span-1 flex items-center text-gray-500 text-xs min-w-[80px]">
              {formatDate(request.updated_at)}
            </div>
            <div className="col-span-1 flex items-center min-w-[80px]" onClick={(e) => {
              e.preventDefault()
              setEditingField({requestId: request.id, field: 'due_date'})
            }}>
              {editingField?.requestId === request.id && editingField?.field === 'due_date' ? (
                <div className="relative w-full max-w-[150px]">
                  <input
                    type="date"
                    value={formatDateForInput(request.due_date || '')}
                    onChange={(e) => {
                      e.preventDefault()
                      handleFieldUpdate(request.id, 'due_date', e.target.value)
                    }}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    className="w-full text-xs border border-gray-300 rounded-md py-1 px-2 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 cursor-pointer shadow-sm z-10 relative"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 pointer-events-none">
                    <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="flex items-center w-full cursor-pointer hover:bg-gray-50 px-1.5 py-0.5 rounded-md transition-colors">
                  <span className="text-xs text-gray-500">{request.due_date ? formatDate(request.due_date) : 'Due Date'}</span>
                </div>
              )}
            </div>
            <div className="col-span-1 flex items-center text-gray-500 text-xs min-w-[80px]">
              {formatDate(request.created_at)}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden flex-1 bg-white">
        {!loading && !error && filteredRequests.map((request) => (
          <div
            key={request.id}
            className="p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <Link href={`/requests/${request.id}`} className="block">
                  <h3 className="font-medium text-gray-900 text-base mb-1 truncate">{request.title}</h3>
                  <p className="text-gray-500 text-sm line-clamp-2">
                    {getDescriptionPreview(request.description) || 'No description'}
                  </p>
                </Link>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <input type="checkbox" className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {isAdmin && (
                <div>
                  <div className="text-gray-500 text-xs font-medium mb-1">CLIENT</div>
                  <div className="font-medium text-gray-900">{request.client?.name || 'Unknown Client'}</div>
                  <div className="text-gray-500 text-xs">{request.client?.client_company?.name || ''}</div>
                </div>
              )}
              
              <div>
                <div className="text-gray-500 text-xs font-medium mb-1">STATUS</div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusStyle(request.status).dot}`}></div>
                  <span className={`capitalize font-medium ${getStatusStyle(request.status).text}`}>
                    {request.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {isAdmin && (
                <div>
                  <div className="text-gray-500 text-xs font-medium mb-1">ASSIGNED TO</div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <span className="text-gray-600">{getMemberName(request.assigned_to) || 'None'}</span>
                  </div>
                </div>
              )}

              <div>
                <div className="text-gray-500 text-xs font-medium mb-1">PRIORITY</div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getPriorityStyle(request.priority).dot}`}></div>
                  <span className={`capitalize font-medium ${getPriorityStyle(request.priority).text}`}>
                    {request.priority}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-gray-500 text-xs font-medium mb-1">UPDATED</div>
                <div className="text-gray-900">{formatDate(request.updated_at)}</div>
              </div>

              <div>
                <div className="text-gray-500 text-xs font-medium mb-1">DUE DATE</div>
                <div className="text-gray-900">{request.due_date ? formatDate(request.due_date) : 'Not set'}</div>
              </div>

              <div>
                <div className="text-gray-500 text-xs font-medium mb-1">CREATED</div>
                <div className="text-gray-900">{formatDate(request.created_at)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 bg-white gap-3">
        <div className="text-sm text-gray-600 text-center sm:text-left">
          {filteredRequests.length === 0 ? (
            'No results found'
          ) : (
            `Showing ${filteredRequests.length} of ${requests.length} request${requests.length !== 1 ? 's' : ''}`
          )}
          {hasActiveFilters() && (
            <span className="ml-2 text-violet-600">
              (filtered)
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows per page</span>
            <select className="text-sm bg-gray-50 border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500">
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
    </div>
  )
}

function AssignDropdown({ requestId, currentAssignedId, onSelect, onClose }: { requestId: string; currentAssignedId?: string; onSelect: (memberId: string) => void; onClose: () => void }) {
  const [members, setMembers] = useState<{ id: string; name: string; email: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/team')
        if (!res.ok) throw new Error('Failed to load team members')
        const data = await res.json()
        if (!cancelled) setMembers(data)
      } catch (e) {
        if (!cancelled) setError('Failed to load team members')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="relative">
      <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded-md shadow-lg w-64 p-2" onClick={() => {}}>
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="text-xs font-medium text-gray-500">Assign to</div>
          <button className="text-gray-400 hover:text-gray-600" onClick={onClose}>×</button>
        </div>
        {loading && <div className="px-2 py-2 text-sm text-gray-500">Loading...</div>}
        {error && <div className="px-2 py-2 text-sm text-red-600">{error}</div>}
        {!loading && !error && (
          <ul className="max-h-60 overflow-auto">
            <li>
              <button
                className={`w-full text-left px-2 py-2 text-sm rounded-md hover:bg-gray-50 ${!currentAssignedId ? 'text-violet-600' : 'text-gray-700'}`}
                onClick={() => { onSelect(''); onClose() }}
              >
                Unassigned
              </button>
            </li>
            {members.map((m) => (
              <li key={m.id}>
                <button
                  className={`w-full text-left px-2 py-2 text-sm rounded-md hover:bg-gray-50 ${currentAssignedId === m.id ? 'text-violet-600' : 'text-gray-700'}`}
                  onClick={() => { onSelect(m.id); onClose() }}
                >
                  {m.name} <span className="text-gray-400">({m.email})</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
