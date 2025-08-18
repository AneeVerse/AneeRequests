"use client"
import { useState, useEffect, useCallback } from "react"
import { Filter, List, LayoutGrid, Plus } from "lucide-react"
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

export default function RequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<Request[]>([])
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([])
  const [activeTab, setActiveTab] = useState<'open' | 'all' | 'unassigned' | 'completed'>('open')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<{requestId: string, field: string} | null>(null)
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string; email: string }[]>([])

  // Filter requests based on active tab
  const filterRequests = useCallback(() => {
    if (activeTab === 'all') {
      setFilteredRequests(requests)
    } else if (activeTab === 'open') {
      setFilteredRequests(requests.filter(req => req.status !== 'completed' && req.status !== 'closed'))
    } else if (activeTab === 'unassigned') {
      // Assuming unassigned requests don't have an assigned_to field or it's null
      setFilteredRequests(requests.filter(req => !req.assigned_to))
    } else if (activeTab === 'completed') {
      setFilteredRequests(requests.filter(req => req.status === 'completed' || req.status === 'closed'))
    }
  }, [requests, activeTab])

  // Load requests from API
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      let url = '/api/requests'
      // If the logged-in user is a team member (impersonated team member in this app),
      // restrict to assigned requests
      if (user?.id?.startsWith('impersonated-team-')) {
        const memberId = user.id.replace('impersonated-team-', '')
        url = `/api/requests?team_member_id=${encodeURIComponent(memberId)}`
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
  }, [user?.id])

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
      
      // Update the requests array with the updated request
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId ? { ...req, ...updatedRequest } : req
        )
      )

      // Clear editing state
      setEditingField(null)
    } catch (err) {
      console.error(`Error updating ${field}:`, err)
      // You could add error handling UI here
    }
  }

  useEffect(() => {
    loadData()
  }, [loadData])

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

  // Apply filters whenever requests or activeTab changes
  useEffect(() => {
    filterRequests()
  }, [requests, activeTab, filterRequests])

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
  const gridColsClass = isAdmin ? 'grid-cols-12' : 'grid-cols-8'

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">
          Requests
        </h1>
        {canCreateRequest && (
          <Link
            href="/requests/new"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
          >
            <Plus size={16} className="stroke-[2.5]" />
            Create Request
          </Link>
        )}
      </div>

      {/* Controls */}
      <div className="px-8 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search requests..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-shadow"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter size={16} className="text-gray-500" />
              Filters
            </button>
            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 gap-1">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors">
                <LayoutGrid size={16} />
              </button>
              <button className="p-2 text-violet-600 bg-gray-50 rounded-md">
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 bg-white border-b border-gray-200">
        <div className="flex gap-6">
          <button 
            onClick={() => setActiveTab('open')}
            className={`py-4 px-2 text-sm font-medium ${activeTab === 'open' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'} -mb-px transition-colors`}
          >
            Open
          </button>
          <button 
            onClick={() => setActiveTab('all')}
            className={`py-4 px-2 text-sm font-medium ${activeTab === 'all' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'} -mb-px transition-colors`}
          >
            All
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('unassigned')}
              className={`py-4 px-2 text-sm font-medium ${activeTab === 'unassigned' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'} -mb-px transition-colors`}
            >
              Unassigned
            </button>
          )}
          <button 
            onClick={() => setActiveTab('completed')}
            className={`py-4 px-2 text-sm font-medium ${activeTab === 'completed' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'} -mb-px transition-colors`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white border-b border-gray-200 overflow-x-auto">
        {/* Table Header */}
        <div className={`grid ${gridColsClass} gap-4 px-8 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50/50 border-y border-gray-200 min-w-[800px]`}>
          <div className="col-span-3 flex items-center min-w-[200px]">TITLE</div>
          {isAdmin && <div className="col-span-2 flex items-center min-w-[120px]">CLIENT</div>}
          <div className="col-span-2 flex items-center min-w-[120px]">STATUS</div>
          {isAdmin && <div className="col-span-2 flex items-center min-w-[120px]">ASSIGNED TO</div>}
          <div className="col-span-1 flex items-center min-w-[80px]">PRIORITY</div>
          <div className="col-span-1 flex items-center min-w-[80px]">UPDATED</div>
          <div className="col-span-1 flex items-center min-w-[80px]">DUE DATE</div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-[400px] min-w-[800px]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-3 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
              <div className="text-sm text-gray-600 font-medium">Loading requests...</div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center h-[400px] min-w-[800px]">
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
          <div className="flex items-center justify-center h-[400px] min-w-[800px]">
            <div className="flex flex-col items-center gap-4 text-center max-w-sm mx-auto">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <div className="text-base text-gray-900 font-medium mb-1">No requests found</div>
                <div className="text-sm text-gray-500 mb-4">Get started by creating your first request</div>
              </div>
              <Link
                href="/requests/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
              >
                <Plus size={16} className="stroke-[2.5]" />
                Create your first request
              </Link>
            </div>
          </div>
        )}

        {/* Empty State - No Requests Matching Filter */}
        {!loading && !error && filteredRequests.length === 0 && requests.length > 0 && (
          <div className="flex items-center justify-center py-16 min-w-[800px]">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-gray-50">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No matching requests</h3>
              <p className="text-sm text-gray-600 mb-6">
                {activeTab === 'open' && 'There are no open requests.'}
                {activeTab === 'unassigned' && 'There are no unassigned requests.'}
                {activeTab === 'completed' && 'There are no completed requests.'}
                {activeTab === 'all' && 'There are no requests matching your criteria.'}
              </p>
              <button
                onClick={() => setActiveTab('all')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                View all requests
              </button>
            </div>
          </div>
        )}

        {/* Table Rows */}
        {!loading && !error && filteredRequests.map((request) => (
          <div
            key={request.id}
            className={`grid ${gridColsClass} gap-4 px-8 py-4 text-sm border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer min-w-[800px] min-h-[80px] items-center`}
          >
            <div className="col-span-3 min-w-[200px]">
              <Link href={`/requests/${request.id}`} className="font-medium text-gray-900 mb-1 hover:text-violet-700" onClick={(e)=>{ if (editingField?.requestId === request.id) e.preventDefault() }}>{request.title}</Link>
              <div className="text-gray-500 text-xs line-clamp-1">
                {getDescriptionPreview(request.description) || 'No description'}
              </div>
            </div>
            {isAdmin && (
              <div className="col-span-2 min-w-[120px]">
                <div className="font-medium text-gray-900">{request.client?.name || 'Unknown Client'}</div>
                <div className="text-gray-500 text-xs">{request.client?.client_company?.name || ''}</div>
              </div>
            )}
            <div className="col-span-2 flex items-center min-w-[120px]" onClick={(e) => {
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
                    className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg py-2 pl-3 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 capitalize cursor-pointer appearance-none shadow-sm z-10 relative"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="pending_response">Pending Response</option>
                    <option value="completed">Completed</option>
                    <option value="closed">Closed</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-md transition-colors">
                  <div className={`w-2 h-2 rounded-full ${getStatusStyle(request.status).dot}`}></div>
                  <span className={`capitalize text-sm font-medium ${getStatusStyle(request.status).text}`}>
                    {request.status.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
            {isAdmin && (
              <div
                className="col-span-2 flex items-center min-w-[120px]"
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
                  <div className="flex items-center gap-2 w-full cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-md transition-colors" title={getMemberName(request.assigned_to) || 'Unassigned'}>
                    <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                    <span className="text-gray-600 text-sm truncate max-w-[140px]">{getMemberName(request.assigned_to) || 'None'}</span>
                    <span className="ml-auto text-gray-400">+</span>
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
                    className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg py-1.5 pl-2 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 capitalize cursor-pointer appearance-none shadow-sm z-10 relative"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-md transition-colors">
                  <div className={`w-2 h-2 rounded-full ${getPriorityStyle(request.priority).dot}`}></div>
                  <span className={`capitalize text-sm font-medium ${getPriorityStyle(request.priority).text}`}>{request.priority}</span>
                </div>
              )}
            </div>
            <div className="col-span-1 flex items-center text-gray-500 text-sm min-w-[80px]">
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
                    className="w-full text-sm border border-gray-300 rounded-lg py-1.5 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 cursor-pointer shadow-sm z-10 relative"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="flex items-center w-full cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-md transition-colors">
                  <span className="text-sm text-gray-500">{request.due_date ? formatDate(request.due_date) : 'No due date'}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-8 py-4 border-t border-gray-200 bg-white">
        <div className="text-sm text-gray-600">
          Showing {requests.length} of {requests.length} result{requests.length !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Rows per page</span>
            <select className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500">
              <option>15</option>
              <option>25</option>
              <option>50</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
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
      <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded-md shadow-lg w-64 p-2" onClick={(e) => e.stopPropagation()}>
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
