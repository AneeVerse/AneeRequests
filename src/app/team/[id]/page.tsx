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
}

export default function TeamMemberDetailPage() {
  const params = useParams()
  const { impersonateTeamMember } = useAuth()
  const memberId = params.id as string
  
  const [member, setMember] = useState<TeamMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
  const [showActionMenu, setShowActionMenu] = useState(false)
  const actionMenuRef = useRef<HTMLDivElement>(null)

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
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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

            {/* Service Requests Section */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Service requests</h2>
              
              {/* Search and Filters Bar */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L6.293 13.293A1 1 0 016 12.586V6z" />
                  </svg>
                  Filters
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>
              
              {serviceRequests.length === 0 ? (
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
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {serviceRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link href={`/requests/${request.id}`} className="text-purple-600 hover:text-purple-800 font-medium">
                              {request.title}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`capitalize ${
                              request.status === 'completed' ? 'text-green-600' :
                              request.status === 'in_progress' ? 'text-yellow-600' :
                              request.status === 'submitted' ? 'text-blue-600' :
                              'text-gray-600'
                            }`}>
                              {request.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${
                              request.priority === 'urgent' ? 'bg-red-600' :
                              request.priority === 'high' ? 'bg-orange-500' :
                              request.priority === 'medium' ? 'bg-yellow-500' :
                              request.priority === 'low' ? 'bg-blue-500' :
                              request.priority === 'none' ? 'bg-gray-400' :
                              'bg-gray-400'
                            }`}>
                              {request.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(request.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}
