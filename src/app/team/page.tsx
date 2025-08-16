"use client"
import { useState, useEffect, useRef } from "react"
import { Filter, LayoutGrid, ChevronDown, MoreHorizontal, Plus, X, Eye, Edit, Trash2, UserCheck } from "lucide-react"
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

export default function TeamPage() {
  const { user, impersonateTeamMember } = useAuth()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "member"
  })
  const [submitting, setSubmitting] = useState(false)

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
      setFormData({ name: "", email: "", role: "member" })
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
      role: member.role
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
      setFormData({ name: "", email: "", role: "member" })
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

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getRoleDisplay(member.role).toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <RouteGuard requireAdmin>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Team</h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
            >
              <Plus size={16} />
              Create team member
            </button>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                  className="mt-2 text-sm text-purple-600 hover:text-purple-700"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredMembers.length === 0 && (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-500 mb-4">
                  {searchTerm ? 'No team members found matching your search' : 'No team members found'}
                </div>
                {!searchTerm && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                  >
                    <Plus size={16} />
                    Add your first team member
                  </button>
                )}
              </div>
            )}

            {/* Table Rows */}
            {!loading && !error && filteredMembers.map((member) => (
              <div key={member.id} className="grid grid-cols-12 gap-4 px-6 py-4 text-sm hover:bg-gray-50">
                <div className="col-span-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-purple-600">{getInitials(member.name)}</span>
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

          {/* Footer */}
          {!loading && !error && filteredMembers.length > 0 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-gray-500">
                Showing {filteredMembers.length} of {teamMembers.length} result{filteredMembers.length !== 1 ? 's' : ''}
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

        {/* Create Team Member Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Create team member</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="johndoe@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <div className="relative">
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white text-gray-900"
                    >
                      <option value="member">Regular team member</option>
                      <option value="admin">Portal Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Edit team member</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingMember(null)
                    setFormData({ name: "", email: "", role: "member" })
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="johndoe@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <div className="relative">
                    <select
                      id="edit-role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white text-gray-900"
                    >
                      <option value="member">Regular team member</option>
                      <option value="admin">Portal Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingMember(null)
                      setFormData({ name: "", email: "", role: "member" })
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  )
}
