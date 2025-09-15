"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, MoreHorizontal, User } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/AuthContext"
import RouteGuard from "@/components/RouteGuard"

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  status: string
  created_at: string
}

interface ServiceRequest {
  id: string
  title: string
  status: string
  priority: string
  created_at: string
  updated_at?: string
  due_date?: string
}

export default function TeamMemberDetailPage() {
  const params = useParams()
  const { impersonateTeamMember } = useAuth()
  const memberId = params.id as string
  
  const [member, setMember] = useState<TeamMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([])
  const [showActionMenu, setShowActionMenu] = useState(false)
  const actionMenuRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<'open' | 'all' | 'completed'>('open')
  const [search, setSearch] = useState('')

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setShowActionMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const loadMember = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/team/${memberId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch team member')
      }
      
      const memberData = await response.json()
      setMember(memberData)
    } catch (err) {
      console.error('Error loading team member:', err)
      setError('Failed to load team member')
    } finally {
      setLoading(false)
    }
  }, [memberId])

  const loadServiceRequests = useCallback(async () => {
    try {
      const response = await fetch(`/api/requests?team_member_id=${memberId}`)
      if (response.ok) {
        const data = await response.json()
        setServiceRequests(data)
      }
    } catch (err) {
      console.error('Error loading service requests:', err)
    }
  }, [memberId])

  useEffect(() => {
    loadMember()
  }, [loadMember])

  useEffect(() => {
    if (member) {
      loadServiceRequests()
    }
  }, [member, loadServiceRequests])

  // Filter logic similar to admin requests list
  useEffect(() => {
    let filtered = serviceRequests

    if (activeTab === 'open') {
      filtered = filtered.filter(r => r.status !== 'completed' && r.status !== 'closed')
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(r => r.status === 'completed' || r.status === 'closed')
    }

    if (search.trim()) {
      const term = search.toLowerCase().trim()
      filtered = filtered.filter(r => r.title.toLowerCase().includes(term))
    }

    setFilteredRequests(filtered)
  }, [serviceRequests, activeTab, search])

  const handleImpersonate = async () => {
    if (!member) return

    try {
      impersonateTeamMember(member.id, member.name, member.email, member.role as 'admin'|'member'|'viewer')
      
      setShowActionMenu(false)
    } catch (err) {
      console.error('Error impersonating team member:', err)
      alert('Failed to impersonate team member')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Admin requests layout helpers for consistent pills
  const getStatusStyle = (status: string) => {
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

  if (loading) {
    return (
      <RouteGuard requireAdmin>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading...</div>
        </div>
      </RouteGuard>
    )
  }

  if (error || !member) {
    return (
      <RouteGuard requireAdmin>
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500">{error || 'Team member not found'}</div>
        </div>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard requireAdmin>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Link 
              href="/team"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={16} />
              Back to Team
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Team member details</h1>
          </div>
        </div>

        {/* Team Member Profile */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <User size={24} className="text-gray-500" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">{member.name}</h2>
                <p className="text-sm text-gray-600">{member.email}</p>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowActionMenu(!showActionMenu)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded"
              >
                <MoreHorizontal size={20} />
              </button>
              
              {showActionMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10" ref={actionMenuRef}>
                  <div className="py-1">
                    <button
                      onClick={handleImpersonate}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Impersonate
                    </button>
                    <Link
                      href={`/team/${memberId}/edit`}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-8">
            <button className="pb-3 text-sm font-medium text-purple-600 border-b-2 border-purple-600">
              Overview
            </button>
            <Link href={`/team/${memberId}/edit`} className="pb-3 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700">
              Settings
            </Link>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Overview Section */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Overview</h2>
              
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="text-2xl font-bold text-gray-900">
                    {serviceRequests.filter(r => r.status === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-600">Completed service requests</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="text-2xl font-bold text-gray-900">
                    {serviceRequests.filter(r => {
                      const lastMonth = new Date()
                      lastMonth.setMonth(lastMonth.getMonth() - 1)
                      return new Date(r.created_at) >= lastMonth
                    }).length}
                  </div>
                  <div className="text-sm text-gray-600">Services requests last month</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="text-2xl font-bold text-gray-900">-</div>
                  <div className="text-sm text-gray-600">Avg. rating</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="text-2xl font-bold text-gray-900">
                    {serviceRequests.filter(r => r.status === 'in_progress' || r.status === 'submitted').length}
                  </div>
                  <div className="text-sm text-gray-600">Active service requests</div>
                </div>
              </div>
            </div>

            {/* Service Requests Section */
            }
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Service requests</h2>
              
              {/* Search and Filters Bar */}
              <div className="px-0 sm:px-0 mb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:w-80">
                    <input
                      type="text"
                      placeholder="Search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 text-xs text-gray-900 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm"
                    />
                    <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {search && (
                      <button onClick={() => setSearch('')} className="absolute right-2 top-2 w-4 h-4 text-gray-400 hover:text-gray-600">×</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white mb-3">
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
                  <button 
                    onClick={() => setActiveTab('completed')}
                    className={`px-4 py-2 text-xs font-medium ${activeTab === 'completed' ? 'text-white bg-primary-600 rounded-md' : 'text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50'} whitespace-nowrap shadow-sm transition-colors`}
                  >
                    Completed
                  </button>
                </div>
              </div>
              
              {filteredRequests.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                  <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No Requests yet</h3>
                  <p className="mt-2 text-gray-500">Get started by creating a new Request.</p>
                  <div className="mt-6">
                    <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      + Create Request
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* Admin-like grid header */}
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                    <div className="col-span-5">TITLE</div>
                    <div className="col-span-2">STATUS</div>
                    <div className="col-span-1">PRIORITY</div>
                    <div className="col-span-1">UPDATED</div>
                    <div className="col-span-1">DUE DATE</div>
                    <div className="col-span-2">CREATED</div>
                  </div>
                  <div>
                    {filteredRequests.map((request) => (
                      <div key={request.id} className="grid grid-cols-12 gap-4 px-4 py-4 text-xs border-b border-gray-200 hover:bg-gray-50">
                        <div className="col-span-5">
                          <Link href={`/requests/${request.id}`} className="font-medium text-gray-900 hover:text-primary-700 line-clamp-1">
                            {request.title}
                          </Link>
                        </div>
                        <div className="col-span-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusStyle(request.status).bg} ${getStatusStyle(request.status).text}`}>
                            {request.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="col-span-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getPriorityStyle(request.priority).dot}`}></div>
                            <span className={`text-xs font-medium capitalize ${getPriorityStyle(request.priority).text}`}>{request.priority}</span>
                          </div>
                        </div>
                        <div className="col-span-1 text-gray-500">
                          {formatDate(request.updated_at || request.created_at)}
                        </div>
                        <div className="col-span-1 text-gray-500">
                          {request.due_date ? formatDate(request.due_date) : 'Due Date'}
                        </div>
                        <div className="col-span-2 text-gray-500">
                          {formatDate(request.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}
