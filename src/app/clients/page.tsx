"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { Filter, LayoutGrid, ChevronDown, MoreHorizontal, Plus, Eye, Edit, UserCheck, ArrowRightLeft, Trash2, X, Search, Menu, Phone, Mail, Building } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/AuthContext"
import RouteGuard from "@/components/RouteGuard"

interface Client {
  id: string
  name: string
  email?: string
  created_at: string
  client_company?: {
    name: string
  }
}

interface Organization {
  _id: string
  name: string
  clientCount: number
}

interface FilterState {
  search: string
  organization: string
  status: string
  createdDate: string
}

export default function ClientsPage() {
  const { user, impersonateClient } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  
  // Change organization modal state
  const [showChangeOrgModal, setShowChangeOrgModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loadingOrgs, setLoadingOrgs] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [changingOrg, setChangingOrg] = useState(false)
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)

  // Filter state
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    organization: '',
    status: '',
    createdDate: ''
  })

  // Filter clients based on search and filters
  const filterClients = useCallback(() => {
    let filtered = clients

    // Apply search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim()
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm) ||
        client.client_company?.name.toLowerCase().includes(searchTerm)
      )
    }

    // Apply organization filter
    if (filters.organization) {
      filtered = filtered.filter(client => client.client_company?.name === filters.organization)
    }

    // Apply status filter (individual vs organization)
    if (filters.status) {
      if (filters.status === 'individual') {
        filtered = filtered.filter(client => !client.client_company?.name)
      } else if (filters.status === 'organization') {
        filtered = filtered.filter(client => client.client_company?.name)
      }
    }

    // Apply created date filter
    if (filters.createdDate) {
      const createdDate = new Date(filters.createdDate)
      filtered = filtered.filter(client => {
        const clientCreatedDate = new Date(client.created_at)
        return clientCreatedDate.toDateString() === createdDate.toDateString()
      })
    }

    setFilteredClients(filtered)
  }, [clients, filters])

  // Apply filters whenever clients or filters change
  useEffect(() => {
    filterClients()
  }, [clients, filters, filterClients])

  const clearFilters = () => {
    setFilters({
      search: '',
      organization: '',
      status: '',
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
    loadClients()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && menuRefs.current[openMenuId]) {
        if (!menuRefs.current[openMenuId]!.contains(event.target as Node)) {
          setOpenMenuId(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenuId])

  // Close modal when clicking outside
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowChangeOrgModal(false)
      }
    }

    if (showChangeOrgModal) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [showChangeOrgModal])

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

  const toggleMenu = (clientId: string) => {
    setOpenMenuId(openMenuId === clientId ? null : clientId)
  }

  const handleDeleteClient = async (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    if (!client) return
    
    setClientToDelete(client)
    setShowDeleteModal(true)
    setOpenMenuId(null)
  }

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return

    setDeletingClientId(clientToDelete.id)
    try {
      const response = await fetch(`/api/clients/${clientToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete client')
      }

      // Remove the client from the list
      setClients(prev => prev.filter(client => client.id !== clientToDelete.id))
      setShowDeleteModal(false)
      setClientToDelete(null)
    } catch (err) {
      console.error('Error deleting client:', err)
      alert('Failed to delete client')
    } finally {
      setDeletingClientId(null)
    }
  }

  const loadOrganizations = async () => {
    try {
      setLoadingOrgs(true)
      const response = await fetch('/api/organizations')
      
      if (!response.ok) {
        throw new Error('Failed to fetch organizations')
      }
      
      const data = await response.json()
      setOrganizations(data)
    } catch (err) {
      console.error('Error loading organizations:', err)
      alert('Failed to load organizations')
    } finally {
      setLoadingOrgs(false)
    }
  }

  const openChangeOrgModal = async (client: Client) => {
    setSelectedClient(client)
    setSelectedOrg(client.client_company?.name || '')
    setSearchTerm('')
    setShowChangeOrgModal(true)
    await loadOrganizations()
  }

  const handleChangeOrganization = async () => {
    if (!selectedClient) return

    setChangingOrg(true)
    try {
      const response = await fetch(`/api/clients/${selectedClient.id}/change-organization`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationName: selectedOrg }),
      })

      if (!response.ok) {
        throw new Error('Failed to update organization')
      }

      // Update the client in the list
      setClients(prev => prev.map(client => 
        client.id === selectedClient.id 
          ? { ...client, client_company: selectedOrg ? { name: selectedOrg } : undefined }
          : client
      ))

      setShowChangeOrgModal(false)
      setSelectedClient(null)
      setSelectedOrg('')
    } catch (err) {
      console.error('Error changing organization:', err)
      alert('Failed to change organization')
    } finally {
      setChangingOrg(false)
    }
  }

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  return (
    <RouteGuard requireAnyPermission={['view_clients', 'create_clients', 'edit_clients', 'delete_clients']}>
      <div className="flex flex-col h-full bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-600 hover:text-gray-900">
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Clients</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-600 hover:text-gray-900">
              <Search size={20} />
            </button>
            <Link 
              href="/clients/new"
              className="p-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700"
            >
              <Plus size={20} />
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 gap-3">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Clients</h1>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            <span className="hidden sm:inline">Announcements</span>
            <span className="sm:hidden">Announce</span>
          </button>
          <Link 
            href="/clients/new"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Create Client Account</span>
            <span className="sm:hidden">Create</span>
          </Link>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="lg:hidden px-4 py-3 bg-white border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Search clients..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 pr-10 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          {filters.search && (
            <button
              onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Desktop Tabs and Search */}
      <div className="hidden lg:block px-4 sm:px-6 py-4">
        {/* Tabs */}
        <div className="flex gap-4 sm:gap-8 mb-6 overflow-x-auto">
          <button className="pb-3 text-sm font-medium text-primary-600 border-b-2 border-primary-600 whitespace-nowrap">
            Clients
          </button>
          <button className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">
            Organizations
          </button>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search clients, emails, organizations..."
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
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              showFilters || hasActiveFilters()
                ? 'text-violet-700 bg-violet-50'
                : 'text-gray-700 bg-gray-100'
            }`}
          >
            <Filter size={16} />
            <span>Filters</span>
            {hasActiveFilters() && (
              <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
            )}
          </button>
          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <X size={14} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="px-4 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Organization Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                <select
                  value={filters.organization}
                  onChange={(e) => setFilters(prev => ({ ...prev, organization: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All organizations</option>
                  {organizations.map((org) => (
                    <option key={org._id} value={org.name}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All clients</option>
                  <option value="individual">Individual clients</option>
                  <option value="organization">Organization clients</option>
                </select>
              </div>

              {/* Created Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Created Date</label>
                <input
                  type="date"
                  value={filters.createdDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, createdDate: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Card Layout */}
        <div className="lg:hidden px-4 py-4 space-y-3">
          {/* Loading State */}
          {loading && (
            <div className="px-4 py-12 text-center">
              <div className="text-gray-500">Loading clients...</div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="px-4 py-12 text-center">
              <div className="text-red-600">{error}</div>
              <button 
                onClick={loadClients}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredClients.length === 0 && clients.length === 0 && (
            <div className="px-4 py-12 text-center">
              <div className="text-gray-500 mb-4">No clients found</div>
              <Link 
                href="/clients/new"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
              >
                <Plus size={16} />
                Create your first client
              </Link>
            </div>
          )}

          {/* Empty State - No Clients Matching Filter */}
          {!loading && !error && filteredClients.length === 0 && clients.length > 0 && (
            <div className="px-4 py-12 text-center">
              <div className="text-gray-500 mb-4">
                {hasActiveFilters() ? 'No clients match your filters' : 'No clients found'}
              </div>
              {hasActiveFilters() && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100"
                >
                  <X size={14} />
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Mobile Client Cards */}
          {!loading && !error && filteredClients.map((client) => (
            <div key={client.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">{getInitials(client.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/clients/${client.id}`}
                      className="font-medium text-gray-900 hover:text-primary-600 transition-colors cursor-pointer block truncate"
                    >
                      {client.name}
                    </Link>
                    {client.email && (
                      <div className="flex items-center gap-1 mt-1">
                        <Mail size={12} className="text-gray-400 flex-shrink-0" />
                        <Link 
                          href={`/clients/${client.id}`}
                          className="text-gray-500 text-xs hover:text-primary-600 transition-colors cursor-pointer truncate"
                        >
                          {client.email}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => toggleMenu(client.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  disabled={deletingClientId === client.id}
                >
                  <MoreHorizontal size={20} />
                </button>
              </div>

              {/* Client Details */}
              <div className="space-y-2 mb-3">
                {client.client_company && (
                  <div className="flex items-center gap-2">
                    <Building size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{client.client_company.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Created:</span>
                  <span className="text-xs text-gray-600">{formatDate(client.created_at)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <Link
                  href={`/clients/${client.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  onClick={() => setOpenMenuId(null)}
                >
                  <Eye size={16} />
                  View
                </Link>
                <Link
                  href={`/clients/${client.id}/edit`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  onClick={() => setOpenMenuId(null)}
                >
                  <Edit size={16} />
                  Edit
                </Link>
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                  onClick={() => {
                    setOpenMenuId(null)
                    if (user?.role === 'admin') {
                      impersonateClient(
                        client.id,
                        client.name,
                        client.email || '',
                        client.client_company?.name
                      )
                    } else {
                      alert('Only admins can impersonate clients')
                    }
                  }}
                >
                  <UserCheck size={16} />
                  Impersonate
                </button>
              </div>

              {/* Dropdown Menu */}
              {openMenuId === client.id && (
                <div 
                  ref={(el) => { menuRefs.current[client.id] = el }}
                  className="absolute right-4 top-16 z-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                >
                  <button
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      setOpenMenuId(null)
                      openChangeOrgModal(client)
                    }}
                  >
                    <ArrowRightLeft size={16} />
                    Change organization
                  </button>
                  <button
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteClient(client.id)}
                    disabled={deletingClientId === client.id}
                  >
                    <Trash2 size={16} />
                    {deletingClientId === client.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block bg-white rounded-lg border border-gray-200">
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
                className="mt-2 text-sm text-primary-600 hover:text-primary-700"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredClients.length === 0 && clients.length === 0 && (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-500 mb-4">No clients found</div>
              <Link 
                href="/clients/new"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                <Plus size={16} />
                Create your first client
              </Link>
            </div>
          )}

          {/* Empty State - No Clients Matching Filter */}
          {!loading && !error && filteredClients.length === 0 && clients.length > 0 && (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-500 mb-4">
                {hasActiveFilters() ? 'No clients match your filters' : 'No clients found'}
              </div>
              {hasActiveFilters() && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-md hover:bg-violet-100"
                >
                  <X size={14} />
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Table Rows */}
          {!loading && !error && filteredClients.map((client) => (
            <div key={client.id} className="grid grid-cols-12 gap-4 px-6 py-4 text-sm border-b border-gray-200 hover:bg-gray-50">
              <div className="col-span-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-600">{getInitials(client.name)}</span>
                  </div>
                  <div>
                    <Link 
                      href={`/clients/${client.id}`}
                      className="font-medium text-gray-900 hover:text-primary-600 transition-colors cursor-pointer"
                    >
                      {client.name}
                    </Link>
                    {client.email && (
                      <Link 
                        href={`/clients/${client.id}`}
                        className="text-gray-500 text-xs hover:text-primary-600 transition-colors cursor-pointer block"
                      >
                        {client.email}
                      </Link>
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
              <div className="col-span-1 flex justify-end relative">
                <button 
                  onClick={() => toggleMenu(client.id)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  disabled={deletingClientId === client.id}
                >
                  <MoreHorizontal size={16} />
                </button>
                
                {openMenuId === client.id && (
                  <div 
                    ref={(el) => { menuRefs.current[client.id] = el }}
                    className="absolute right-0 top-8 z-10 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1"
                  >
                    <Link
                      href={`/clients/${client.id}`}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setOpenMenuId(null)}
                    >
                      <Eye size={16} />
                      View
                    </Link>
                    <Link
                      href={`/clients/${client.id}/edit`}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setOpenMenuId(null)}
                    >
                      <Edit size={16} />
                      Edit
                    </Link>
                    <button
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        setOpenMenuId(null)
                        if (user?.role === 'admin') {
                          impersonateClient(
                            client.id,
                            client.name,
                            client.email || '',
                            client.client_company?.name
                          )
                        } else {
                          alert('Only admins can impersonate clients')
                        }
                      }}
                    >
                      <UserCheck size={16} />
                      Impersonate
                    </button>
                    <button
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        setOpenMenuId(null)
                        openChangeOrgModal(client)
                      }}
                    >
                      <ArrowRightLeft size={16} />
                      Change organization
                    </button>
                    <button
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteClient(client.id)}
                      disabled={deletingClientId === client.id}
                    >
                      <Trash2 size={16} />
                      {deletingClientId === client.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Footer */}
        {!loading && !error && filteredClients.length > 0 && (
          <div className="lg:hidden px-4 py-4 bg-white border-t border-gray-200">
            <div className="text-center text-sm text-gray-500 mb-4">
              {filteredClients.length === 0 ? (
                'No results found'
              ) : (
                `Showing ${filteredClients.length} of ${clients.length} client${clients.length !== 1 ? 's' : ''}`
              )}
              {hasActiveFilters() && (
                <span className="ml-2 text-violet-600">
                  (filtered)
                </span>
              )}
            </div>
            <div className="flex items-center justify-center gap-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-lg">1 of 1</span>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Desktop Footer */}
        {!loading && !error && filteredClients.length > 0 && (
          <div className="hidden lg:flex flex-col sm:flex-row items-center justify-between pt-4 gap-3 px-6">
            <div className="text-sm text-gray-500 text-center sm:text-left">
              {filteredClients.length === 0 ? (
                'No results found'
              ) : (
                `Showing ${filteredClients.length} of ${clients.length} client${clients.length !== 1 ? 's' : ''}`
              )}
              {hasActiveFilters() && (
                <span className="ml-2 text-violet-600">
                  (filtered)
                </span>
              )}
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

       {/* Change Organization Modal */}
       {showChangeOrgModal && selectedClient && (
         <div 
           className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
           onClick={() => setShowChangeOrgModal(false)}
         >
           <div 
             className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
             onClick={(e) => e.stopPropagation()}
           >
             {/* Modal Header */}
             <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
               <h3 className="text-lg font-medium text-gray-900">
                 Change Organization
               </h3>
               <button
                 onClick={() => setShowChangeOrgModal(false)}
                 className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
               >
                 <X size={20} />
               </button>
             </div>

             {/* Modal Body */}
             <div className="p-4 sm:p-6">
               <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Organization
                 </label>
                 <select
                   value={selectedOrg}
                   onChange={(e) => setSelectedOrg(e.target.value)}
                   className="w-full px-3 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                 >
                   <option value="">Select an option</option>
                   <option value="">Individual (No Organization)</option>
                   {organizations.map((org) => (
                     <option key={org._id} value={org.name}>
                       {org.name} ({org.clientCount} clients)
                     </option>
                   ))}
                 </select>
               </div>

               <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Search
                 </label>
                 <div className="relative">
                   <input
                     type="text"
                     placeholder="Search organizations..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                   />
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                 </div>
               </div>

               {/* Organization List */}
               <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                 {loadingOrgs ? (
                   <div className="p-4 text-center text-gray-500">
                     Loading organizations...
                   </div>
                 ) : filteredOrganizations.length === 0 ? (
                   <div className="p-4 text-center text-gray-500">
                     No organizations found
                   </div>
                 ) : (
                   <div className="divide-y divide-gray-200">
                     <div
                       className={`p-4 cursor-pointer hover:bg-gray-50 ${
                         selectedOrg === '' ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                       }`}
                       onClick={() => setSelectedOrg('')}
                     >
                       <div className="font-medium text-gray-900">Individual</div>
                       <div className="text-sm text-gray-500">No organization</div>
                     </div>
                     {filteredOrganizations.map((org) => (
                       <div
                         key={org._id}
                         className={`p-4 cursor-pointer hover:bg-gray-50 ${
                           selectedOrg === org.name ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                         }`}
                         onClick={() => setSelectedOrg(org.name)}
                       >
                         <div className="font-medium text-gray-900">{org.name}</div>
                         <div className="text-sm text-gray-500">{org.clientCount} clients</div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             </div>

             {/* Modal Footer */}
             <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-200">
               <button
                 onClick={() => setShowChangeOrgModal(false)}
                 className="w-full sm:w-auto px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
               >
                 Cancel
               </button>
               <button
                 onClick={handleChangeOrganization}
                 disabled={changingOrg}
                 className="w-full sm:w-auto px-4 py-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {changingOrg ? 'Changing...' : 'Change Organization'}
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Delete Confirmation Modal */}
       {showDeleteModal && clientToDelete && (
         <div 
           className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4"
           onClick={() => setShowDeleteModal(false)}
         >
           <div 
             className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 transform transition-all"
             onClick={(e) => e.stopPropagation()}
           >
             {/* Modal Header */}
             <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                   <Trash2 size={20} className="text-red-600" />
                 </div>
                 <h3 className="text-lg font-semibold text-gray-900">Delete Client</h3>
               </div>
               <button
                 onClick={() => setShowDeleteModal(false)}
                 className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors"
               >
                 <X size={16} />
               </button>
             </div>
             
             {/* Modal Body */}
             <div className="p-4 sm:p-6">
               <p className="text-gray-700 mb-6">
                 Are you sure you want to delete client &quot;{clientToDelete.name}&quot;? This action cannot be undone and will permanently remove the client and all associated data.
               </p>
               
               <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                 <div className="flex items-start gap-3">
                   <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                   </svg>
                   <div>
                     <p className="text-sm font-medium text-red-800">Warning</p>
                     <p className="text-sm text-red-700 mt-1">This will delete the client account and all associated requests and data.</p>
                   </div>
                 </div>
               </div>
             </div>
             
             {/* Modal Footer */}
             <div className="flex flex-col sm:flex-row gap-3 p-4 sm:p-6 border-t border-gray-200">
               <button
                 onClick={() => setShowDeleteModal(false)}
                 className="w-full sm:flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
               >
                 Cancel
               </button>
               <button
                 onClick={confirmDeleteClient}
                 disabled={deletingClientId === clientToDelete.id}
                 className="w-full sm:flex-1 px-4 py-3 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                 {deletingClientId === clientToDelete.id ? (
                   <div className="flex items-center justify-center gap-2">
                     <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     Deleting...
                   </div>
                 ) : (
                   'Delete Client'
                 )}
               </button>
             </div>
           </div>
         </div>
       )}
     </RouteGuard>
   )
 }
