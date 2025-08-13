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
}

export default function RequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/requests')
      
      if (!response.ok) {
        throw new Error('Failed to fetch requests')
      }
      
      const data = await response.json()
      setRequests(data)
    } catch (err) {
      console.error('Error loading requests:', err)
      setError('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

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

  const isAdmin = user?.role === 'admin'
  const isClient = user?.role === 'client'
  const canCreateRequest = isAdmin || isClient

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">
          {isAdmin ? 'Requests' : 'My Requests'}
        </h1>
        {canCreateRequest && (
          <Link
            href="/requests/new"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
          >
            <Plus size={16} />
            Create Request
          </Link>
        )}
      </div>

      {/* Controls */}
      <div className="px-6 py-4 ">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
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
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
              <Filter size={16} />
              Filters
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <LayoutGrid size={16} />
            </button>
            <button className="p-2 text-purple-600 bg-purple-50 rounded">
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-gray-200">
        <div className="flex gap-8">
          <button className="pb-3 text-sm font-medium text-purple-600 border-b-2 border-purple-600">
            Open
          </button>
          <button className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-700">
            All
          </button>
          {isAdmin && (
            <button className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-700">
              Unassigned
            </button>
          )}
          <button className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-700">
            Completed
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-200 bg-gray-50">
          <div className="col-span-4">TITLE</div>
          {isAdmin && <div className="col-span-2">CLIENT</div>}
          <div className="col-span-1">STATUS</div>
          {isAdmin && <div className="col-span-2">ASSIGNED TO</div>}
          <div className="col-span-1">PRIORITY</div>
          <div className="col-span-1">UPDATED</div>
          <div className="col-span-1">DUE DATE</div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading requests...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center py-12">
            <div className="text-red-600">{error}</div>
          </div>
        )}

        {/* Empty State - Admin with no clients */}
        {/* {!loading && !error && isAdmin && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-gray-500 mb-4">No requests found</div>
              <p className="text-sm text-gray-400 mb-4">You need to create clients first before you can create requests</p>
              <Link
                href="/clients/new"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
              >
                <Plus size={16} />
                Create your first client
              </Link>
            </div>
          </div>
        )} */}

        {/* Empty State - No Requests */}
        {!loading && !error && requests.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-gray-500 mb-4">No requests found</div>
              <p className="text-sm text-gray-400 mb-4">
                {isAdmin ? 'Create your first request to get started' : 'You haven\'t created any requests yet'}
              </p>
              <Link
                href="/requests/new"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
              >
                <Plus size={16} />
                Create your first request
              </Link>
            </div>
          </div>
        )}

        {/* Table Rows */}
        {!loading && !error && requests.map((request) => (
          <Link 
            key={request.id}
            href={`/requests/${request.id}`}
            className="grid grid-cols-12 gap-4 px-6 py-4 text-sm border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
          >
            <div className="col-span-4">
              <div className="font-medium text-gray-900">{request.title}</div>
              <div className="text-gray-500 text-xs mt-1">
                {request.description?.substring(0, 50) + '...' || 'No description'}
              </div>
            </div>
            {isAdmin && (
              <div className="col-span-2">
                <div className="font-medium text-gray-900">{request.client?.name || 'Unknown Client'}</div>
                <div className="text-gray-500 text-xs">{request.client?.client_company?.name || 'Individual'}</div>
              </div>
            )}
            <div className="col-span-1">
              <span className={`text-sm font-medium capitalize ${getStatusColor(request.status)}`}>
                {request.status.replace('_', ' ')}
              </span>
            </div>
            {isAdmin && (
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                  <span className="text-gray-500">None</span>
                </div>
              </div>
            )}
            <div className="col-span-1">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getPriorityColor(request.priority)}`}></div>
                <span className="text-gray-500 capitalize">{request.priority}</span>
              </div>
            </div>
            <div className="col-span-1 text-gray-500">
              {formatDate(request.updated_at)}
            </div>
            <div className="col-span-1 text-gray-500">
              {request.due_date ? formatDate(request.due_date) : 'No due date'}
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Showing {requests.length} of {requests.length} result{requests.length !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Rows per page</span>
            <select className="text-sm border border-gray-300 rounded px-2 py-1">
              <option>15</option>
            </select>
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
    </div>
  )
}
