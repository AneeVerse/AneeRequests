"use client"
import { useState, useEffect } from "react"
import { Calendar, Filter, List, LayoutGrid, ChevronDown } from "lucide-react"
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
  description: string
  status: string
  priority: string
  client_id: string
  created_at: string
  updated_at: string
  due_date?: string
  client?: {
    id: string
    name: string
    client_company?: {
      name: string
    }
  }
  service_catalog_item?: {
    id: string
    title: string
  }
}

export default function DashboardPage() {
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

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/stats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      
      const data = await response.json()
      setStats(data.stats)
      setRecentRequests(data.recentRequests)
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
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
      case 'in_review': return 'text-purple-600'
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Welcome, anees</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md">
            <Calendar size={16} />
            <span>10 Jul - 10 Aug</span>
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">REVENUE</div>
            <div className="text-2xl font-semibold text-gray-900">
              {loading ? "Loading..." : `$${stats.revenue.toFixed(2)}`}
            </div>
            <div className="text-sm text-gray-400">—</div>
            <div className="w-full h-1 bg-gray-100 rounded">
              <div className="h-1 bg-purple-600 rounded" style={{ width: '0%' }}></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">CLIENTS</div>
            <div className="text-2xl font-semibold text-gray-900">
              {loading ? "Loading..." : stats.clients}
            </div>
            <div className="text-sm text-gray-400">—</div>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">REQUESTS</div>
            <div className="text-2xl font-semibold text-gray-900">
              {loading ? "Loading..." : stats.requests}
            </div>
            <div className="text-sm text-gray-400">—</div>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">REVIEWS</div>
            <div className="text-2xl font-semibold text-gray-900">
              {loading ? "Loading..." : stats.reviews}
            </div>
            <div className="text-sm text-gray-400">—</div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="flex items-center justify-center py-16 mb-8">
          <div className="text-center">
            <LayoutGrid size={48} className="mx-auto mb-4 text-gray-300" />
            <div className="text-sm font-medium text-gray-500">No revenue for the selected period</div>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="w-80 pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
            <div className="absolute left-3 top-2.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
              <Filter size={16} />
              Filters
              <ChevronDown size={14} />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <LayoutGrid size={16} />
            </button>
            <button className="p-2 text-gray-700 bg-gray-100 rounded">
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4">
          <div className="flex gap-8">
            <button className="pb-3 text-sm font-medium text-purple-600 border-b-2 border-purple-600">
              Open
            </button>
            <button className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-700">
              All
            </button>
            <button className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-700">
              Unassigned
            </button>
            <button className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-700">
              Completed
            </button>
          </div>
        </div>

        {/* Table Headers */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50 rounded-t-md">
          <div className="col-span-1 flex items-center">
            <input type="checkbox" className="w-4 h-4 text-purple-600 border-gray-300 rounded" />
          </div>
          <div className="col-span-3">TITLE</div>
          <div className="col-span-2">CLIENT</div>
          <div className="col-span-1">STATUS</div>
          <div className="col-span-2">ASSIGNED TO</div>
          <div className="col-span-1">PRIORITY</div>
          <div className="col-span-1">UPDATED</div>
          <div className="col-span-1">DUE DATE</div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16 border border-gray-200 rounded-b-md">
            <div className="text-gray-500">Loading requests...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center py-16 border border-gray-200 rounded-b-md">
            <div className="text-red-600">{error}</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && recentRequests.length === 0 && (
          <div className="flex items-center justify-center py-16 border border-gray-200 rounded-b-md">
            <div className="text-center">
              <div className="text-gray-500 mb-4">No requests yet</div>
              <p className="text-sm text-gray-400">Create your first client to get started with requests</p>
            </div>
          </div>
        )}

        {/* Table Rows */}
        {!loading && !error && recentRequests.map((request) => (
          <Link 
            key={request.id}
            href={`/requests/${request.id}`}
            className="grid grid-cols-12 gap-4 px-4 py-4 text-sm border-l border-r border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
          >
            <div className="col-span-1 flex items-center">
              <input type="checkbox" className="w-4 h-4 text-purple-600 border-gray-300 rounded" />
            </div>
            <div className="col-span-3">
              <div className="font-medium text-gray-900">{request.title}</div>
              <div className="text-gray-500 text-xs mt-1">
                {request.service_catalog_item?.title || request.description?.substring(0, 50) + '...' || 'No description'}
              </div>
            </div>
            <div className="col-span-2">
              <div className="font-medium text-gray-900">{request.client?.name || 'Unknown Client'}</div>
              <div className="text-gray-500 text-xs">{request.client?.client_company?.name || 'Individual'}</div>
            </div>
            <div className="col-span-1">
              <span className={`text-sm font-medium capitalize ${getStatusColor(request.status)}`}>
                {request.status.replace('_', ' ')}
              </span>
            </div>
            <div className="col-span-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                <span className="text-gray-500">None</span>
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getPriorityColor(request.priority)}`}></div>
                <span className="text-gray-500 capitalize">{request.priority}</span>
              </div>
            </div>
            <div className="col-span-1 text-gray-500">
              {formatDate(request.updated_at)}
            </div>
            <div className="col-span-1">
              <div className="flex items-center gap-1 text-gray-500">
                <span>{request.due_date ? formatDate(request.due_date) : 'Due Date'}</span>
                <ChevronDown size={12} />
              </div>
            </div>
          </Link>
        ))}

        {/* Footer */}
        {!loading && !error && recentRequests.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
            <div className="text-sm text-gray-500">
              Showing {recentRequests.length} of {stats.requests} total requests
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Rows per page</span>
                <select className="text-sm border border-gray-300 rounded px-2 py-1">
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
  )
}
