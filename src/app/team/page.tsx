"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { Filter, LayoutGrid, ChevronDown, MoreHorizontal, Plus, X, Eye, Edit, Trash2, UserCheck, Search, Menu, Mail, Shield, Users } from "lucide-react"
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

interface FilterState {
  search: string
  role: string
  status: string
  createdDate: string
}

export default function TeamPage() {
  const { user, impersonateTeamMember } = useAuth()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [filteredTeamMembers, setFilteredTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null)
  // const [searchTerm, setSearchTerm] = useState('') // Commented out unused variable
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "member",
    password: ""
  })
  const [submitting, setSubmitting] = useState(false)

  // Filter state
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    role: '',
    status: '',
    createdDate: ''
  })

  // Filter team members based on search and filters
  const filterTeamMembers = useCallback(() => {
    let filtered = teamMembers

    // Apply search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim()
      filtered = filtered.filter(member => 
        member.name.toLowerCase().includes(searchTerm) ||
        member.email.toLowerCase().includes(searchTerm) ||
        member.role.toLowerCase().includes(searchTerm)
      )
    }

    // Apply role filter
    if (filters.role) {
      filtered = filtered.filter(member => member.role === filters.role)
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(member => member.status === filters.status)
    }

    // Apply created date filter
    if (filters.createdDate) {
      const createdDate = new Date(filters.createdDate)
      filtered = filtered.filter(member => {
        const memberCreatedDate = new Date(member.created_at)
        return memberCreatedDate.toDateString() === createdDate.toDateString()
      })
    }

    setFilteredTeamMembers(filtered)
  }, [teamMembers, filters])

  // Apply filters whenever team members or filters change
  useEffect(() => {
    filterTeamMembers()
  }, [teamMembers, filters, filterTeamMembers])

  const clearFilters = () => {
    setFilters({
      search: '',
      role: '',
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
    loadTeamMembers()
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

  const loadTeamMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/team')
      
      if (!response.ok) {
        throw new Error('Failed to fetch team members')
      }
      
      const data = await response.json()
      setTeamMembers(data)
    } catch (err) {
      console.error('Error loading team members:', err)
      setError('Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.email.trim()) {
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create team member')
      }
      
      // Success - reload team members and close modal
      await loadTeamMembers()
      setShowModal(false)
      setFormData({ name: "", email: "", role: "member", password: "" })
    } catch (err) {
      console.error('Error creating team member:', err)
      alert(err instanceof Error ? err.message : 'Failed to create team member')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member)
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      password: ""
    })
    setShowEditModal(true)
    setOpenMenuId(null)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingMember) return
    
    if (!formData.name.trim() || !formData.email.trim()) {
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/team/${editingMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update team member')
      }
      
      // Success - reload team members and close modal
      await loadTeamMembers()
      setShowEditModal(false)
      setEditingMember(null)
      setFormData({ name: "", email: "", role: "member", password: "" })
    } catch (err) {
      console.error('Error updating team member:', err)
      alert(err instanceof Error ? err.message : 'Failed to update team member')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (memberId: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) {
      return
    }

    setDeletingMemberId(memberId)
    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete team member')
      }
      
      await loadTeamMembers()
    } catch (err) {
      console.error('Error deleting team member:', err)
      alert('Failed to delete team member')
    } finally {
      setDeletingMemberId(null)
    }
  }

  const handleImpersonate = (member: TeamMember) => {
    if (user?.role !== 'admin') return
    impersonateTeamMember(
      member.id,
      member.name,
      member.email,
      (member.role as 'admin' | 'member' | 'viewer')
    )
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

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin': return 'Portal Admin'
      case 'member': return 'Regular team member'
      case 'viewer': return 'Viewer'
      default: return role
    }
  }

  const getStatusDisplay = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  // Removed duplicate filtering logic - using filterTeamMembers instead

  return (
    <RouteGuard requireAnyPermission={['view_team', 'create_team', 'edit_team', 'delete_team']}>
      <div className="flex flex-col h-full bg-gray-50">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Menu size={20} />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Team</h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Search size={20} />
              </button>
              <button 
                onClick={() => setShowModal(true)}
                className="p-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Team</h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              <Plus size={16} />
              Create team member
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="lg:hidden px-4 py-3 bg-white border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search team members..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-10 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

        {/* Desktop Search and Controls */}
        <div className="hidden lg:block px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search team members, emails, roles..."
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
              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All roles</option>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Created Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Created Date</label>
                <input
                  type="date"
                  value={filters.createdDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, createdDate: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <div className="text-gray-500">Loading team members...</div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="px-4 py-12 text-center">
              <div className="text-red-600">{error}</div>
              <button 
                onClick={loadTeamMembers}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredTeamMembers.length === 0 && teamMembers.length === 0 && (
            <div className="px-4 py-12 text-center">
              <div className="text-gray-500 mb-4">No team members found</div>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Plus size={16} />
                Add your first team member
              </button>
            </div>
          )}

          {/* Empty State - No Team Members Matching Filter */}
          {!loading && !error && filteredTeamMembers.length === 0 && teamMembers.length > 0 && (
            <div className="px-4 py-12 text-center">
              <div className="text-gray-500 mb-4">
                {hasActiveFilters() ? 'No team members match your filters' : 'No team members found'}
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

          {/* Mobile Team Member Cards */}
          {!loading && !error && filteredTeamMembers.map((member) => (
            <div key={member.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{getInitials(member.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{member.name}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <Mail size={12} className="text-gray-400 flex-shrink-0" />
                      <div className="text-gray-500 text-xs truncate">{member.email}</div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <MoreHorizontal size={20} />
                </button>
              </div>

              {/* Team Member Details */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">{getRoleDisplay(member.role)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    member.status === 'active' 
                      ? 'text-green-700 bg-green-100' 
                      : member.status === 'inactive'
                      ? 'text-red-700 bg-red-100'
                      : 'text-yellow-700 bg-yellow-100'
                  }`}>
                    • {getStatusDisplay(member.status)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">0 organizations</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Created:</span>
                  <span className="text-xs text-gray-600">{formatDate(member.created_at)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <Link
                  href={`/team/${member.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  onClick={() => setOpenMenuId(null)}
                >
                  <Eye size={16} />
                  View
                </Link>
                <button
                  onClick={() => handleEdit(member)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleImpersonate(member)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <UserCheck size={16} />
                  Impersonate
                </button>
              </div>

              {/* Dropdown Menu */}
              {openMenuId === member.id && (
                <div
                  ref={(el) => {
                    menuRefs.current[member.id] = el
                  }}
                  className="absolute right-4 top-16 z-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                >
                  <button
                    onClick={() => handleDelete(member.id)}
                    disabled={deletingMemberId === member.id}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                    {deletingMemberId === member.id ? 'Deleting...' : 'Delete'}
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
            <div className="col-span-3 flex items-center gap-2">
              NAME
              <button>
                <ChevronDown size={12} className="text-gray-400" />
              </button>
            </div>
            <div className="col-span-2">ROLE</div>
            <div className="col-span-2">STATUS</div>
            <div className="col-span-2">MANAGED ORGANIZATIONS</div>
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
              <div className="text-gray-500">Loading team members...</div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="px-6 py-12 text-center">
              <div className="text-red-600">{error}</div>
              <button 
                onClick={loadTeamMembers}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredTeamMembers.length === 0 && teamMembers.length === 0 && (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-500 mb-4">No team members found</div>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Plus size={16} />
                Add your first team member
              </button>
            </div>
          )}

          {/* Empty State - No Team Members Matching Filter */}
          {!loading && !error && filteredTeamMembers.length === 0 && teamMembers.length > 0 && (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-500 mb-4">
                {hasActiveFilters() ? 'No team members match your filters' : 'No team members found'}
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
          {!loading && !error && filteredTeamMembers.map((member) => (
            <div key={member.id} className="grid grid-cols-12 gap-4 px-6 py-4 text-sm hover:bg-gray-50">
              <div className="col-span-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">{getInitials(member.name)}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{member.name}</div>
                    <div className="text-gray-500 text-xs">{member.email}</div>
                  </div>
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-gray-900">{getRoleDisplay(member.role)}</span>
              </div>
              <div className="col-span-2">
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                  member.status === 'active' 
                    ? 'text-green-700 bg-green-100' 
                    : member.status === 'inactive'
                    ? 'text-red-700 bg-red-100'
                    : 'text-yellow-700 bg-yellow-100'
                }`}>
                  • {getStatusDisplay(member.status)}
                </span>
              </div>
              <div className="col-span-2 text-gray-900">
                0
              </div>
              <div className="col-span-2 text-gray-500">
                {formatDate(member.created_at)}
              </div>
              <div className="col-span-1 flex justify-end">
                <div className="relative">
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  
                  {openMenuId === member.id && (
                    <div
                      ref={(el) => {
                        menuRefs.current[member.id] = el
                      }}
                      className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10"
                    >
                      <Link
                        href={`/team/${member.id}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Eye size={16} />
                        View
                      </Link>
                      <button
                        onClick={() => handleEdit(member)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleImpersonate(member)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <UserCheck size={16} />
                        Impersonate
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        disabled={deletingMemberId === member.id}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                      >
                        <Trash2 size={16} />
                        {deletingMemberId === member.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Footer */}
        {!loading && !error && filteredTeamMembers.length > 0 && (
          <div className="lg:hidden px-4 py-4 bg-white border-t border-gray-200">
            <div className="text-center text-sm text-gray-500 mb-4">
              {filteredTeamMembers.length === 0 ? (
                'No results found'
              ) : (
                `Showing ${filteredTeamMembers.length} of ${teamMembers.length} team member${teamMembers.length !== 1 ? 's' : ''}`
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
        {!loading && !error && filteredTeamMembers.length > 0 && (
          <div className="hidden lg:flex flex-col sm:flex-row items-center justify-between pt-4 gap-3 px-6">
            <div className="text-sm text-gray-500 text-center sm:text-left">
              {filteredTeamMembers.length === 0 ? (
                'No results found'
              ) : (
                `Showing ${filteredTeamMembers.length} of ${teamMembers.length} team member${teamMembers.length !== 1 ? 's' : ''}`
              )}
              {hasActiveFilters() && (
                <span className="ml-2 text-violet-600">
                  (filtered)
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
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

        {/* Create Team Member Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Create team member</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="johndoe@example.com"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <div className="relative">
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-gray-900"
                    >
                      <option value="member">Regular team member</option>
                      <option value="admin">Portal Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password (optional)
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Set an initial password"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">If provided, a login account will be created immediately.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-full sm:w-auto px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Creating...' : 'Save changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Team Member Modal */}
        {showEditModal && editingMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Edit team member</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingMember(null)
                    setFormData({ name: "", email: "", role: "member", password: "" })
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleEditSubmit} className="p-4 sm:p-6 space-y-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="johndoe@example.com"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <div className="relative">
                    <select
                      id="edit-role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-gray-900"
                    >
                      <option value="member">Regular team member</option>
                      <option value="admin">Portal Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingMember(null)
                      setFormData({ name: "", email: "", role: "member", password: "" })
                    }}
                    className="w-full sm:w-auto px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </RouteGuard>
  )
}
