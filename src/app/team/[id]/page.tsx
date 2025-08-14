"use client"
import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import RouteGuard from "@/components/RouteGuard"

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  status: string
  created_at: string
}

export default function TeamMemberDetailPage() {
  const params = useParams()
  const router = useRouter()
  const memberId = params.id as string
  
  const [member, setMember] = useState<TeamMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    loadMember()
  }, [loadMember])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this team member?')) {
      return
    }

    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete team member')
      }
      
      router.push('/team')
    } catch (err) {
      console.error('Error deleting team member:', err)
      alert('Failed to delete team member')
    }
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Portal Admin'
      case 'member':
        return 'Regular team member'
      case 'viewer':
        return 'Viewer'
      default:
        return role
    }
  }

  const getStatusDisplay = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/team"
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{member.name}</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/team/${member.id}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Edit size={16} />
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>

          {/* Member Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="text-sm text-gray-900">{member.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{member.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Role</dt>
                    <dd className="text-sm text-gray-900">{getRoleDisplay(member.role)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="text-sm text-gray-900">{getStatusDisplay(member.status)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created At</dt>
                    <dd className="text-sm text-gray-900">{formatDate(member.created_at)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}
