"use client"
import { useState, useEffect } from "react"
import { Filter, LayoutGrid, ChevronDown, MoreHorizontal, Plus } from "lucide-react"
import Link from "next/link"

interface Client {
  id: string
  name: string
  email?: string
  created_at: string
  client_company?: {
    name: string
  }
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/clients')
      
      if (!response.ok) {
        throw new Error('Failed to fetch clients')
      }
      
      const data = await response.json()
      setClients(data)
    } catch (err) {
      console.error('Error loading clients:', err)
      setError('Failed to load clients')
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Announcements
          </button>
          <Link 
            href="/clients/new"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
          >
            <Plus size={16} />
            Create client
          </Link>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="px-6 py-4">
        {/* Tabs */}
        <div className="flex gap-8 mb-6">
          <button className="pb-3 text-sm font-medium text-purple-600 border-b-2 border-purple-600">
            Clients
          </button>
          <button className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-700">
            Organizations
          </button>
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
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-200">
            <div className="col-span-4 flex items-center gap-2">
              NAME
              <button>
                <ChevronDown size={12} className="text-gray-400" />
              </button>
            </div>
            <div className="col-span-3">ORGANIZATION</div>
            <div className="col-span-2">LAST LOGIN</div>
            <div className="col-span-2 flex items-center gap-2">
              CREATED AT
              <button>
                <ChevronDown size={12} className="text-gray-400" />
              </button>
            </div>
            <div className="col-span-1"></div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-500">Loading clients...</div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="px-6 py-12 text-center">
              <div className="text-red-600">{error}</div>
              <button 
                onClick={loadClients}
                className="mt-2 text-sm text-purple-600 hover:text-purple-700"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && clients.length === 0 && (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-500 mb-4">No clients found</div>
              <Link 
                href="/clients/new"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
              >
                <Plus size={16} />
                Create your first client
              </Link>
            </div>
          )}

          {/* Table Rows */}
          {!loading && !error && clients.map((client) => (
            <div key={client.id} className="grid grid-cols-12 gap-4 px-6 py-4 text-sm border-b border-gray-200 hover:bg-gray-50">
              <div className="col-span-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-purple-600">{getInitials(client.name)}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{client.name}</div>
                    {client.email && (
                      <div className="text-gray-500 text-xs">{client.email}</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-span-3">
                {client.client_company ? (
                  <span className="text-gray-900">{client.client_company.name}</span>
                ) : (
                  <span className="text-gray-500 italic">Individual</span>
                )}
              </div>
              <div className="col-span-2 text-gray-500">
                {/* Empty for last login */}
              </div>
              <div className="col-span-2 text-gray-500">
                {formatDate(client.created_at)}
              </div>
              <div className="col-span-1 flex justify-end">
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {!loading && !error && clients.length > 0 && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-gray-500">
              Showing {clients.length} of {clients.length} result{clients.length !== 1 ? 's' : ''}
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
