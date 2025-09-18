"use client"
import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Edit, FileText, CreditCard, Settings, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import RouteGuard from "@/components/RouteGuard"

interface Client {
  id: string
  name: string
  email?: string
  client_company_name?: string
  created_at: string
}

interface Request {
  id: string
  title: string
  status: string
  priority: string
  created_at: string
  due_date?: string
}

interface Invoice {
  id: string
  amount: number
  status: string
  due_date: string
  created_at: string
}

// Status dropdown component
function StatusDropdown({ 
  currentStatus, 
  onStatusChange, 
  onClose 
}: { 
  currentStatus: string
  onStatusChange: (status: string) => void
  onClose: () => void 
}) {
  const statusOptions = [
    { value: 'submitted', label: 'Submitted', color: 'bg-gray-100 text-gray-700' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
    { value: 'pending_response', label: 'Pending Response', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' },
    { value: 'closed', label: 'Closed', color: 'bg-purple-100 text-purple-700' }
  ]

  return (
    <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-[99999] dropdown-content">
      <div className="py-2">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              onStatusChange(option.value)
              onClose()
            }}
            className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 transition-colors ${
              currentStatus === option.value ? 'bg-gray-200' : ''
            }`}
          >
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${option.color}`}>
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Priority dropdown component
function PriorityDropdown({ 
  currentPriority, 
  onPriorityChange, 
  onClose 
}: { 
  currentPriority: string
  onPriorityChange: (priority: string) => void
  onClose: () => void 
}) {
  const priorityOptions = [
    { value: 'none', label: 'None', dotColor: 'bg-gray-400' },
    { value: 'low', label: 'Low', dotColor: 'bg-green-500' },
    { value: 'medium', label: 'Medium', dotColor: 'bg-yellow-500' },
    { value: 'high', label: 'High', dotColor: 'bg-red-500' },
    { value: 'urgent', label: 'Urgent', dotColor: 'bg-red-600' }
  ]

  return (
    <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-200 z-[99999] dropdown-content">
      <div className="py-2">
        {priorityOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              onPriorityChange(option.value)
              onClose()
            }}
            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-3 ${
              currentPriority === option.value ? 'bg-gray-100' : ''
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${option.dotColor}`}></div>
            <span className="capitalize text-gray-900">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}



export default function ClientDetailPage() {
  const params = useParams()
  const clientId = params.id as string
  
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("requests")


  // Check for tab parameter in URL and set active tab accordingly
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    if (tab && ['overview', 'requests', 'invoices', 'settings'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [])
  const [requests, setRequests] = useState<Request[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [savingChanges, setSavingChanges] = useState(false)
  
  // Editing state for requests
  const [editingField, setEditingField] = useState<{requestId: string, field: string} | null>(null)

  const loadClient = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/clients/${clientId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch client')
      }
      
      const clientData = await response.json()
      setClient(clientData)
    } catch (err) {
      console.error('Error loading client:', err)
      setError('Failed to load client')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  const loadRequests = useCallback(async () => {
    try {
      const response = await fetch(`/api/requests?client_id=${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data)
      } else {
        // Fallback to sample data for testing
        setRequests([
          {
            id: '1',
            title: 'Sample Request 1',
            status: 'submitted',
            priority: 'medium',
            created_at: new Date().toISOString(),
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
          },
          {
            id: '2',
            title: 'Sample Request 2',
            status: 'in_progress',
            priority: 'high',
            created_at: new Date().toISOString(),
            due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
          }
        ])
      }
    } catch (err) {
      console.error('Error loading requests:', err)
      // Fallback to sample data for testing
      setRequests([
        {
          id: '1',
          title: 'Sample Request 1',
          status: 'submitted',
          priority: 'medium',
          created_at: new Date().toISOString(),
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        },
        {
          id: '2',
          title: 'Sample Request 2',
          status: 'in_progress',
          priority: 'high',
          created_at: new Date().toISOString(),
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
        }
      ])
    }
  }, [clientId])

  const loadInvoices = useCallback(async () => {
    try {
      const response = await fetch(`/api/invoices?client_id=${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setInvoices(data)
      }
    } catch (err) {
      console.error('Error loading invoices:', err)
    }
  }, [clientId])

  useEffect(() => {
    loadClient()
  }, [loadClient])

  useEffect(() => {
    if (activeTab === "requests") {
      loadRequests()
    } else if (activeTab === "invoices") {
      loadInvoices()
    }
  }, [activeTab, loadRequests, loadInvoices])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (editingField && !target.closest('.dropdown-content')) {
        setEditingField(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [editingField])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleChangePassword = async () => {
    if (!newPassword.trim()) return
    
    setChangingPassword(true)
    try {
      const response = await fetch(`/api/clients/${clientId}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      })
      
      if (response.ok) {
        alert('Password changed successfully')
        setShowPasswordModal(false)
        setNewPassword("")
      } else {
        throw new Error('Failed to change password')
      }
    } catch (err) {
      console.error('Error changing password:', err)
      alert('Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleFieldUpdate = async (requestId: string, field: string, value: string) => {
    try {
      console.log(`Updating request ${requestId} field ${field} to value: ${value}`)
      
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
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error Response:', response.status, errorData)
        throw new Error(`Failed to update ${field}: ${response.status} ${errorData.error || 'Unknown error'}`)
      }

      const updatedRequest = await response.json()
      console.log('Successfully updated request:', updatedRequest)
      
      // Update the request in the local state
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId ? {
            ...req,
            [field]: value,
            updated_at: updatedRequest.updated_at
          } : req
        )
      )
      
      setEditingField(null)
    } catch (error) {
      console.error(`Error updating ${field}:`, error)
      alert(`Failed to update ${field}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const saveClientChanges = async () => {
    if (!client) return
    
    setSavingChanges(true)
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: client.name,
          email: client.email,
          client_company_name: client.client_company_name
        }),
      })
      
      if (response.ok) {
        alert('Client information updated successfully')
      } else {
        throw new Error('Failed to update client information')
      }
    } catch (err) {
      console.error('Error updating client:', err)
      alert('Failed to update client information')
    } finally {
      setSavingChanges(false)
    }
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

  if (error || !client) {
    return (
      <RouteGuard requireAdmin>
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500">{error || 'Client not found'}</div>
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
              href="/clients"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={16} />
              Back to Clients
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Client Details</h1>
          </div>
          <Link
            href={`/clients/${clientId}/edit`}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#073742] rounded-md hover:bg-[#0a4a5a]"
          >
            <Edit size={16} />
            Edit Client
          </Link>
        </div>

        {/* Tabs */}
        <div className=" px-6 mt-2 border-b border-gray-200">
          <div className="flex gap-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "overview"
                  ? "text-[#073742] border-[#073742]"
                  : "text-gray-500 border-transparent hover:text-[#073742]"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "requests"
                  ? "text-[#073742] border-[#073742]"
                  : "text-gray-500 border-transparent hover:text-[#073742]"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText size={16} />
                Requests
              </div>
            </button>
            <button
              onClick={() => setActiveTab("invoices")}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "invoices"
                  ? "text-[#073742] border-[#073742]"
                  : "text-gray-500 border-transparent hover:text-[#073742]"
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditCard size={16} />
                Invoices
              </div>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "settings"
                  ? "text-[#073742] border-[#073742]"
                  : "text-gray-500 border-transparent hover:text-[#073742]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings size={16} />
                Settings
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto" style={{ overflow: 'visible' }}>
          {activeTab === "overview" && (
            <div className="max-w-2xl">
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                {/* Client Name */}
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Client Name</h2>
                  <p className="text-gray-700">{client.name}</p>
                </div>
                
                {/* Email */}
                {client.email && (
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-2">Email</h2>
                    <p className="text-gray-700">{client.email}</p>
                  </div>
                )}

                {/* Company */}
                {client.client_company_name && (
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-2">Company/Organization</h2>
                    <p className="text-gray-700">{client.client_company_name}</p>
                  </div>
                )}

                {/* Created Date */}
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Created</h2>
                  <p className="text-gray-700">{formatDate(client.created_at)}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "requests" && (
            <div className="space-y-6" style={{ overflow: 'visible' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Requests</h2>
                <Link
                  href={`/requests/new?client_id=${clientId}`}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#073742] rounded-md hover:bg-[#0a4a5a]"
                >
                  Create Requests
                </Link>
              </div>
              
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="text-2xl font-bold text-gray-900">{requests.filter(r => r.status === 'in_progress' || r.status === 'submitted').length}</div>
                  <div className="text-sm text-gray-600">Active Requests</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="text-2xl font-bold text-gray-900">{requests.filter(r => r.status === 'completed').length}</div>
                  <div className="text-sm text-gray-600">Completed Requests</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="text-2xl font-bold text-gray-900">-</div>
                  <div className="text-sm text-gray-600">Average rating</div>
                </div>
              </div>
              
              {/* Search and Filters Bar */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#073742] focus:border-[#073742]"
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
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2">
                  List
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {requests.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                  <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No Requests yet</h3>
                  <p className="mt-2 text-gray-500">Get started by creating a new Request.</p>
                  <div className="mt-6">
                    <Link
                      href={`/requests/new?client_id=${clientId}`}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#073742] rounded-md hover:bg-[#0a4a5a]"
                    >
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      + Create Request
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200" style={{ overflow: 'visible' }}>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {requests.map((request) => (
                        <tr key={request.id} className={`hover:bg-gray-50 relative ${editingField?.requestId === request.id ? 'z-10' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link href={`/requests/${request.id}`} className="text-[#073742] hover:text-[#0a4a5a] font-medium">
                              {request.title}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap relative">
                            {editingField?.requestId === request.id && editingField?.field === 'status' ? (
                              <div className="relative">
                                <StatusDropdown
                                  currentStatus={request.status}
                                  onStatusChange={(newStatus) => {
                                    handleFieldUpdate(request.id, 'status', newStatus)
                                  }}
                                  onClose={() => setEditingField(null)}
                                />
                              </div>
                            ) : (
                              <div 
                                className="inline-flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => setEditingField({requestId: request.id, field: 'status'})}
                              >
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(request.status).bg} ${getStatusStyle(request.status).text}`}>
                                  {request.status.replace(/_/g, ' ')}
                                </span>
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap relative">
                            {editingField?.requestId === request.id && editingField?.field === 'priority' ? (
                              <div className="relative">
                                <PriorityDropdown
                                  currentPriority={request.priority}
                                  onPriorityChange={(newPriority) => {
                                    handleFieldUpdate(request.id, 'priority', newPriority)
                                  }}
                                  onClose={() => setEditingField(null)}
                                />
                              </div>
                            ) : (
                              <div 
                                className="inline-flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => setEditingField({requestId: request.id, field: 'priority'})}
                              >
                                <div className={`w-2 h-2 rounded-full ${getPriorityStyle(request.priority).dot}`}></div>
                                <span className={`text-xs font-medium capitalize ${getPriorityStyle(request.priority).text}`}>{request.priority}</span>
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap relative">
                            {editingField?.requestId === request.id && editingField?.field === 'due_date' ? (
                              <div className="relative">
                                <input
                                  type="date"
                                  value={request.due_date ? new Date(request.due_date).toISOString().split('T')[0] : ''}
                                  onChange={(e) => {
                                    handleFieldUpdate(request.id, 'due_date', e.target.value)
                                  }}
                                  onBlur={() => setEditingField(null)}
                                  autoFocus
                                  className="w-full text-xs border border-gray-300 rounded-md py-1 px-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#073742] focus:border-[#073742] cursor-pointer shadow-sm z-10 relative"
                                  min={new Date().toISOString().split('T')[0]}
                                />
                              </div>
                            ) : (
                              <div 
                                className="inline-flex items-center px-2 py-1 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => setEditingField({requestId: request.id, field: 'due_date'})}
                              >
                                <span className="text-gray-500 text-sm">
                                  {request.due_date ? formatDate(request.due_date) : 'Set Due Date'}
                                </span>
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(request.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-gray-400 hover:text-gray-600">
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "invoices" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Invoices</h2>
                <button className="px-4 py-2 text-sm font-medium text-white bg-[#073742] rounded-md hover:bg-[#0a4a5a]">
                  Create invoice
                </button>
              </div>
              
              {/* Search and Filters Bar */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#073742] focus:border-[#073742]"
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
              
              {invoices.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                  <CreditCard size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No invoices found for this client</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NUMBER</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PAYMENT METHOD</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CREATED</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TOTAL</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link href={`/invoices/${invoice.id}`} className="text-[#073742] hover:text-[#0a4a5a] font-medium">
                              INV-{invoice.id.slice(-10)}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            -
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                invoice.status === 'paid' ? 'bg-green-500' :
                                invoice.status === 'overdue' ? 'bg-red-500' :
                                'bg-orange-500'
                              }`}></div>
                              <span className="text-sm text-gray-900 capitalize">
                                {invoice.status === 'overdue' ? 'Pending' : invoice.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(invoice.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            ${invoice.amount.toFixed(2)} USD
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-gray-400 hover:text-gray-600">
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Pagination */}
                  <div className="bg-white px-6 py-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Showing 1 to {invoices.length} of {invoices.length} results
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">Rows per page:</span>
                        <select className="text-sm border border-gray-300 rounded px-2 py-1">
                          <option>15</option>
                        </select>
                        <div className="flex items-center gap-1">
                          <button className="p-1 text-gray-400 cursor-not-allowed">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                          </button>
                          <button className="p-1 text-gray-400 cursor-not-allowed">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button className="p-1 text-gray-400 cursor-not-allowed">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          <button className="p-1 text-gray-400 cursor-not-allowed">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-4xl space-y-6">
              {/* Client Information Management */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Client Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Name
                    </label>
                    <input
                      type="text"
                      value={client.name}
                      onChange={(e) => setClient({ ...client, name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#073742] focus:border-transparent text-black"
                      placeholder="Enter client name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={client.email || ''}
                      onChange={(e) => setClient({ ...client, email: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#073742] focus:border-transparent text-black"
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company/Organization
                    </label>
                    <input
                      type="text"
                      value={client.client_company_name || ''}
                      onChange={(e) => setClient({ ...client, client_company_name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#073742] focus:border-transparent text-black"
                      placeholder="Enter company or organization name"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button 
                    onClick={saveClientChanges}
                    disabled={savingChanges}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#073742] rounded-md hover:bg-[#0a4a5a] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingChanges ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              {/* Account Security */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Account Security</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Change Password</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Change the client&apos;s login password. This will immediately log them out of all sessions.
                    </p>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="px-4 py-2 text-sm font-medium text-white bg-[#073742] rounded-md hover:bg-[#0a4a5a]"
                    >
                      Change Password
                    </button>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Account Status</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Active</span>
                      </div>
                      <button className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100">
                        Deactivate Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Settings */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Settings</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                      <p className="text-sm text-gray-600">Receive email updates about requests and invoices</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#073742] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#073742]"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">SMS Notifications</h3>
                      <p className="text-sm text-gray-600">Receive SMS updates about important changes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#073742] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#073742]"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-600">Enable additional security for client account</p>
                    </div>
                    <button className="px-3 py-1 text-sm font-medium text-[#073742] bg-[#073742]/10 border border-[#073742]/20 rounded-md hover:bg-[#073742]/20">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-lg border border-red-200 p-6">
                <h2 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-red-900 mb-2">Delete Client Account</h3>
                    <p className="text-sm text-red-700 mb-4">
                      Permanently delete this client account and all associated data. This action cannot be undone.
                    </p>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                      Delete Client Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Client Password</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#073742] focus:border-transparent text-black"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={!newPassword.trim() || changingPassword}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#073742] rounded-lg hover:bg-[#0a4a5a] disabled:opacity-50"
                  >
                    {changingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  )
}
