"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { Filter, List, Plus, Bell, ChevronDown, X, Search } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/AuthContext"
import { ClientUser } from "@/lib/types/auth"

// Status dropdown component
function StatusDropdown({ 
  currentStatus, 
  onStatusChange, 
  onClose 
}: { 
  currentStatus: string
  onStatusChange: (status: string) => void
  onClose: () => void 
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const statusOptions = [
    { value: 'submitted', label: 'Submitted', color: 'bg-gray-100 text-gray-700' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
    { value: 'pending_response', label: 'Pending Response', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' },
    { value: 'closed', label: 'Closed', color: 'bg-purple-100 text-purple-700' }
  ]

  const filteredOptions = statusOptions.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-60 overflow-y-auto"
    >
      <div className="p-3 border-b border-gray-200">
        <input
          type="text"
          placeholder="Search or create a status"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
        />
      </div>
      <div className="py-2">
        {filteredOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              onStatusChange(option.value)
              onClose()
            }}
            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors ${
              currentStatus === option.value ? 'bg-gray-200' : ''
            }`}
          >
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${option.color}`}>
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Priority dropdown component
function PriorityDropdown({ 
  currentPriority, 
  onPriorityChange, 
  onClose 
}: { 
  currentPriority: string
  onPriorityChange: (priority: string) => void
  onClose: () => void 
}) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  const priorityOptions = [
    { value: 'none', label: 'None', dotColor: 'bg-gray-400' },
    { value: 'low', label: 'Low', dotColor: 'bg-green-500' },
    { value: 'medium', label: 'Medium', dotColor: 'bg-yellow-500' },
    { value: 'high', label: 'High', dotColor: 'bg-red-500' },
    { value: 'urgent', label: 'Urgent', dotColor: 'bg-red-600' }
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-60 overflow-y-auto"
    >
      <div className="py-2">
        {priorityOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              onPriorityChange(option.value)
              onClose()
            }}
            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center gap-3 ${
              currentPriority === option.value ? 'bg-gray-100' : ''
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${option.dotColor}`}></div>
             <span className="capitalize text-gray-900">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

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

  // Helper function to get member name
  const getMemberName = useCallback((id?: string) => {
    if (!id) return undefined
    const m = teamMembers.find(tm => tm.id === id)
    return m?.name || m?.email
  }, [teamMembers])

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
  }, [requests, activeTab, filters, getMemberName])

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
        if ((user as ClientUser)?.clientId) {
          const impersonatedClientId = (user as ClientUser).clientId
          if (impersonatedClientId) {
            clientId = impersonatedClientId
          }
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
  }, [user])

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
      console.log(`Updating request ${requestId} field ${field} to value: ${value}`)
      
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
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error Response:', response.status, errorData)
        throw new Error(`Failed to update ${field}: ${response.status} ${errorData.error || 'Unknown error'}`)
      }

      const updatedRequest = await response.json()
      console.log('Successfully updated request:', updatedRequest)
      
      // Update the request in the local state, preserving all existing data
      setRequests(prevRequests => {
        const currentRequest = prevRequests.find(req => req.id === requestId)
        console.log('Current request before update:', currentRequest)
        console.log('Current request client data:', currentRequest?.client)
        
        return prevRequests.map(req => 
          req.id === requestId ? {
            ...req, // Keep all existing data
            [field]: value, // Update only the specific field
            updated_at: updatedRequest.updated_at, // Update the timestamp
            // Ensure client data is preserved
            client: req.client || updatedRequest.client
          } : req
        )
      })
      
      setEditingField(null)
    } catch (error) {
      console.error(`Error updating ${field}:`, error)
      alert(`Failed to update ${field}: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

  // Apply filters whenever requests, activeTab, or filters change
  useEffect(() => {
    filterRequests()
  }, [filterRequests])

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
  // When impersonating, show admin interface but with client's data
  const effectiveRole = isImpersonating ? 'admin' : user?.role
  // Impersonated clients can only read, not edit
  const canEdit = !isImpersonating && (effectiveRole === 'admin')
  const canCreateRequest = effectiveRole === 'admin' || effectiveRole === 'client'

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-gray-900">
            {effectiveRole === 'admin' ? 'Requests' : 'My Requests'}
          </h1>
          {isImpersonating && (
            <span className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-md">
              Impersonating
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canCreateRequest && !isImpersonating && (
            <Link
              href="/requests/new"
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
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

      {/* Page Title Section */}
      <div className="px-4 sm:px-6 py-4 bg-white border-b border-gray-200">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
          Welcome, {user?.name || 'Admin User'}
        </h1>
      </div>

      {/* Search and Controls */}
      <div className="px-4 sm:px-6 py-6 bg-white">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          {!isImpersonating ? (
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
          ) : (
            <div className="w-full sm:w-80 text-sm text-gray-500">
              Viewing your requests (read-only mode)
            </div>
          )}
          <div className="flex items-center gap-2">
            {!isImpersonating && (
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
            )}
                          {!isImpersonating && (
                <button className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 bg-white shadow-sm">
                  <List size={16} />
                  <span className="hidden sm:inline">List</span>
                  <ChevronDown size={12} />
                </button>
              )}
          </div>
        </div>
        
        {hasActiveFilters() && !isImpersonating && (
          <div className="flex items-center gap-2 mb-4">
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
      {showFilters && !isImpersonating && (
        <div className="px-4 sm:px-6 py-3 bg-gray-50 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {/* Client Filter */}
            {!isImpersonating && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Client</label>
                <select
                  value={filters.client}
                  onChange={(e) => setFilters(prev => ({ ...prev, client: e.target.value }))}
                  disabled={filterDataLoading}
                  className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
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
            )}

            {/* Organization Filter */}
            {!isImpersonating && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Organization</label>
                <select
                  value={filters.organization}
                  onChange={(e) => setFilters(prev => ({ ...prev, organization: e.target.value }))}
                  disabled={filterDataLoading}
                  className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
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
            )}

            {/* Assigned To Filter */}
            {effectiveRole === 'admin' && !isImpersonating && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Assigned To</label>
                <select
                  value={filters.assignedTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
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
      <div className="px-4 sm:px-6 bg-white mb-4">
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

      {/* Desktop Table */}
      <div className="hidden lg:block flex-1 bg-white px-4 sm:px-6 py-6">
        {/* Table Header */}
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
            <div className="col-span-1 flex items-center">
              {!isImpersonating && (
                <input type="checkbox" className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
              )}
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
            {!loading && !error && filteredRequests.length === 0 && requests.length === 0 && (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="text-gray-500 mb-4 text-xs">No requests yet</div>
                  <p className="text-xs text-gray-400">Create your first request to get started</p>
                </div>
              </div>
            )}

            {/* Empty State - No Requests Matching Filter */}
            {!loading && !error && filteredRequests.length === 0 && requests.length > 0 && (
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
                className="grid grid-cols-12 gap-4 px-4 py-4 text-xs border-b border-gray-200 hover:bg-gray-50 cursor-pointer last:border-b-0"
              >
                <div className="col-span-1 flex items-center">
                  {!isImpersonating && (
                    <input type="checkbox" className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                  )}
                </div>
                <div className="col-span-3">
                  <Link 
                    href={`/requests/${request.id}`} 
                    className="font-medium text-gray-900 hover:text-primary-700 line-clamp-1" 
                    onClick={(e)=>{ if (editingField?.requestId === request.id) e.preventDefault() }}
                  >
                    {request.title}
                  </Link>
                  <div className="text-gray-500 mt-1 line-clamp-1">
                    {getDescriptionPreview(request.description) || 'No description'}
                  </div>
                </div>
                {effectiveRole === 'admin' && (
                  <div className="col-span-2">
                    <div className="font-medium text-gray-900">{request.client?.name || 'Unknown Client'}</div>
                    <div className="text-gray-500">{request.client?.client_company?.name || ''}</div>
                  </div>
                )}
                <div className="col-span-1 relative">
                  {editingField?.requestId === request.id && editingField?.field === 'status' && canEdit ? (
                    <div className="relative">
                      <StatusDropdown
                        currentStatus={request.status}
                        onStatusChange={(newStatus) => {
                          handleFieldUpdate(request.id, 'status', newStatus)
                        }}
                        onClose={() => setEditingField(null)}
                      />
                    </div>
                  ) : (
                    <div className={`-ml-4 inline-flex items-center gap-2 px-2 py-1 rounded-md ${canEdit ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`} onClick={canEdit ? (e) => {
                      e.preventDefault()
                      setEditingField({requestId: request.id, field: 'status'})
                    } : undefined}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusStyle(request.status).bg} ${getStatusStyle(request.status).text}`}>
                        {request.status.replace(/_/g, ' ')}
                      </span>
                      {canEdit && <ChevronDown size={12} className="text-gray-400" />}
                    </div>
                  )}
                </div>
                {effectiveRole === 'admin' && (
                  <div className="col-span-1">
                    {editingField?.requestId === request.id && editingField?.field === 'assigned_to' && canEdit ? (
                      <AssignDropdown
                        currentAssignedId={request.assigned_to}
                        onSelect={(memberId) => handleFieldUpdate(request.id, 'assigned_to', memberId)}
                        onClose={() => setEditingField(null)}
                      />
                    ) : (
                      <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-md ${canEdit ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`} title={getMemberName(request.assigned_to) || 'Unassigned'} onClick={canEdit ? (e) => {
                        e.preventDefault()
                        setEditingField({ requestId: request.id, field: 'assigned_to' })
                      } : undefined}>
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        </div>
                        <span className="text-gray-700 truncate">{getMemberName(request.assigned_to) || 'None'}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="col-span-1">
                  {editingField?.requestId === request.id && editingField?.field === 'priority' && canEdit ? (
                    <div className="relative w-full max-w-[120px]">
                      <PriorityDropdown
                        currentPriority={request.priority}
                        onPriorityChange={(newPriority) => {
                          handleFieldUpdate(request.id, 'priority', newPriority)
                        }}
                        onClose={() => setEditingField(null)}
                      />
                    </div>
                  ) : (
                    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-md ${canEdit ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`} onClick={canEdit ? (e) => {
                      e.preventDefault()
                      setEditingField({requestId: request.id, field: 'priority'})
                    } : undefined}>
                      <div className={`w-2 h-2 rounded-full ${getPriorityStyle(request.priority).dot}`}></div>
                      <span className={`text-xs font-medium capitalize ${getPriorityStyle(request.priority).text}`}>
                        {request.priority}
                      </span>
                    </div>
                  )}
                </div>
                <div className="col-span-1 text-gray-500">
                  {formatDate(request.updated_at)}
                </div>
                <div className="col-span-1">
                  {editingField?.requestId === request.id && editingField?.field === 'due_date' && canEdit ? (
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
                        className="w-full text-xs border border-gray-300 rounded-md py-1 px-2 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 cursor-pointer shadow-sm z-10 relative"
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 pointer-events-none">
                        <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className={`inline-flex items-center px-2 py-1 rounded-md ${canEdit ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`} onClick={canEdit ? (e) => {
                      e.preventDefault()
                      setEditingField({requestId: request.id, field: 'due_date'})
                    } : undefined}>
                      <span className="text-gray-500">{request.due_date ? formatDate(request.due_date) : 'Due Date'}</span>
                    </div>
                  )}
                </div>
                <div className="col-span-1 text-gray-500">
                  {formatDate(request.created_at)}
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
            className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors bg-white shadow-sm mb-4 mx-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <Link href={`/requests/${request.id}`} className="block">
                  <h3 className="font-medium text-gray-900 text-xs mb-1 truncate">{request.title}</h3>
                  <p className="text-gray-500 text-xs line-clamp-2">
                    {getDescriptionPreview(request.description) || 'No description'}
                  </p>
                </Link>
              </div>
              {!isImpersonating && (
                <div className="flex items-center gap-2 ml-3">
                  <input type="checkbox" className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {effectiveRole === 'admin' && (
                <div className="mb-2">
                  <div className="text-gray-500 text-xs font-medium mb-2">CLIENT</div>
                  <div className="font-medium text-gray-900 text-xs">{request.client?.name || 'Unknown Client'}</div>
                  <div className="text-gray-500 text-xs">{request.client?.client_company?.name || ''}</div>
                </div>
              )}
              
              <div className="mb-2">
                <div className="text-gray-500 text-xs font-medium mb-2">STATUS</div>
                <div className="flex items-center gap-2">
                  {editingField?.requestId === request.id && editingField?.field === 'status' && canEdit ? (
                    <div className="relative">
                      <StatusDropdown
                        currentStatus={request.status}
                        onStatusChange={(newStatus) => {
                          handleFieldUpdate(request.id, 'status', newStatus)
                        }}
                        onClose={() => setEditingField(null)}
                      />
                    </div>
                  ) : (
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-md min-h-[44px] ${canEdit ? 'cursor-pointer hover:bg-gray-100 transition-colors active:bg-gray-200' : ''}`} onClick={canEdit ? (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setEditingField({requestId: request.id, field: 'status'})
                    } : undefined}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusStyle(request.status).bg} ${getStatusStyle(request.status).text}`}>
                        {request.status.replace(/_/g, ' ')}
                      </span>
                      {canEdit && <ChevronDown size={12} className="text-gray-400" />}
                    </div>
                  )}
                </div>
              </div>

              {effectiveRole === 'admin' && (
                <div className="mb-2">
                  <div className="text-gray-500 text-xs font-medium mb-2">ASSIGNED TO</div>
                  <div className="flex items-center gap-2">
                    {editingField?.requestId === request.id && editingField?.field === 'assigned_to' && canEdit ? (
                      <AssignDropdown
                        currentAssignedId={request.assigned_to}
                        onSelect={(memberId) => handleFieldUpdate(request.id, 'assigned_to', memberId)}
                        onClose={() => setEditingField(null)}
                      />
                    ) : (
                      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-md min-h-[44px] ${canEdit ? 'cursor-pointer hover:bg-gray-100 transition-colors active:bg-gray-200' : ''}`} title={getMemberName(request.assigned_to) || 'Unassigned'} onClick={canEdit ? (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setEditingField({ requestId: request.id, field: 'assigned_to' })
                      } : undefined}>
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        </div>
                        <span className="text-gray-600 text-xs truncate">{getMemberName(request.assigned_to) || 'None'}</span>
                        {canEdit && <ChevronDown size={12} className="text-gray-400" />}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-2">
                <div className="text-gray-500 text-xs font-medium mb-2">PRIORITY</div>
                <div className="flex items-center gap-2">
                  {editingField?.requestId === request.id && editingField?.field === 'priority' && canEdit ? (
                    <div className="relative w-full max-w-[120px]">
                      <PriorityDropdown
                        currentPriority={request.priority}
                        onPriorityChange={(newPriority) => {
                          handleFieldUpdate(request.id, 'priority', newPriority)
                        }}
                        onClose={() => setEditingField(null)}
                      />
                    </div>
                  ) : (
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-md min-h-[44px] ${canEdit ? 'cursor-pointer hover:bg-gray-100 transition-colors active:bg-gray-200' : ''}`} onClick={canEdit ? (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setEditingField({requestId: request.id, field: 'priority'})
                    } : undefined}>
                      <div className={`w-2 h-2 rounded-full ${getPriorityStyle(request.priority).dot}`}></div>
                      <span className={`text-xs font-medium capitalize ${getPriorityStyle(request.priority).text}`}>
                        {request.priority}
                      </span>
                      {canEdit && <ChevronDown size={12} className="text-gray-400" />}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-2">
                <div className="text-gray-500 text-xs font-medium mb-2">UPDATED</div>
                <div className="text-gray-900 text-xs">{formatDate(request.updated_at)}</div>
              </div>

              <div className="mb-2">
                <div className="text-gray-500 text-xs font-medium mb-2">DUE DATE</div>
                <div className="flex items-center gap-2">
                  {editingField?.requestId === request.id && editingField?.field === 'due_date' && canEdit ? (
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
                        className="w-full text-xs border border-gray-300 rounded-md py-1 px-2 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 cursor-pointer shadow-sm z-10 relative"
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 pointer-events-none">
                        <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className={`inline-flex items-center px-3 py-2 rounded-md min-h-[44px] ${canEdit ? 'cursor-pointer hover:bg-gray-100 transition-colors active:bg-gray-200' : ''}`} onClick={canEdit ? (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setEditingField({requestId: request.id, field: 'due_date'})
                    } : undefined}>
                      <span className="text-gray-900 text-xs">{request.due_date ? formatDate(request.due_date) : 'Not set'}</span>
                      {canEdit && <ChevronDown size={12} className="text-gray-400" />}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-2">
                <div className="text-gray-500 text-xs font-medium mb-2">CREATED</div>
                <div className="text-gray-900 text-xs">{formatDate(request.created_at)}</div>
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
              `Showing ${filteredRequests.length} of ${requests.length} request${requests.length !== 1 ? 's' : ''}`
            )}
            {hasActiveFilters() && (
              <span className="ml-2 text-primary-600">
                (filtered)
              </span>
            )}
          </div>
          {!isImpersonating ? (
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
          ) : (
            <div className="text-xs text-gray-500">
              Read-only view
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AssignDropdown({ currentAssignedId, onSelect, onClose }: { currentAssignedId?: string; onSelect: (memberId: string) => void; onClose: () => void }) {
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
      } catch {
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
      <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded-md shadow-lg w-64 p-2 max-h-60 overflow-y-auto" onClick={() => {}}>
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
                className={`w-full text-left px-2 py-2 text-sm rounded-md hover:bg-gray-50 active:bg-gray-100 ${!currentAssignedId ? 'text-primary-600' : 'text-gray-700'}`}
                onClick={() => { onSelect(''); onClose() }}
              >
                Unassigned
              </button>
            </li>
            {members.map((m) => (
              <li key={m.id}>
                <button
                  className={`w-full text-left px-2 py-2 text-sm rounded-md hover:bg-gray-50 active:bg-gray-100 ${currentAssignedId === m.id ? 'text-primary-600' : 'text-gray-700'}`}
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
