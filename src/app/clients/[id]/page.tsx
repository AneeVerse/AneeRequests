"use client"
import { useState, useEffect } from "react"
import { ArrowLeft, Edit, Eye, EyeOff, Save, X, Search, Filter, Grid, List, FileText } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/AuthContext"

interface Client {
  id: string
  name: string
  email?: string
  created_at: string
  client_company_name?: string
}

export default async function ViewClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return <ViewClientPageClient clientId={id} />
}

function ViewClientPageClient({ clientId }: { clientId: string }) {
  const { adminResetPassword } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [activeTab, setActiveTab] = useState<'requests' | 'invoices' | 'settings'>('requests')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    client_company_name: ''
  })
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadClient()
  }, [clientId])

  const loadClient = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/clients/${clientId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch client')
      }
      
      const clientData = await response.json()
      setClient(clientData)
      setEditForm({
        name: clientData.name || '',
        email: clientData.email || '',
        client_company_name: clientData.client_company_name || ''
      })
    } catch {
      setError('Failed to load client')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveClient = async () => {
    if (!client) return
    
    setSaving(true)
    setMessage('')
    
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        throw new Error('Failed to update client')
      }

      const updatedClient = await response.json()
      setClient(updatedClient)
      setEditing(false)
      setMessage('Client updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch {
      setMessage('Failed to update client')
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async () => {
    if (!client?.email) return
    
    if (passwordForm.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('Passwords do not match')
      return
    }

    setSaving(true)
    setMessage('')
    
    try {
      const result = await adminResetPassword(client.email, passwordForm.newPassword)
      
      if (result.success) {
        setPasswordForm({ newPassword: '', confirmPassword: '' })
        setMessage('Password reset successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage(result.message)
      }
    } catch {
      setMessage('Failed to reset password')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Link 
              href="/clients"
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Client Details</h1>
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="text-center text-gray-500">Loading client...</div>
        </div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Link 
              href="/clients"
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Client Details</h1>
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="text-center text-red-600">{error || 'Client not found'}</div>
          <div className="text-center mt-4">
            <Link
              href="/clients"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back to Clients
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link 
            href="/clients"
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Client Details</h1>
        </div>
      </div>

      {/* Client Header Card */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-lg font-medium text-purple-600">{getInitials(client.name)}</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{client.name}</h2>
            {client.email && (
              <p className="text-gray-600">{client.email}</p>
            )}
            <p className="text-sm text-gray-500">Created: {formatDate(client.created_at)}</p>
          </div>
        </div>
      </div>

             {/* Tabs */}
       <div className="px-6 py-2 bg-white border-b border-gray-200">
         <div className="flex space-x-6">
           <button
             onClick={() => setActiveTab('requests')}
             className={`py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
               activeTab === 'requests'
                 ? 'border-purple-500 text-purple-600'
                 : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
             }`}
           >
             Requests
           </button>
           <button
             onClick={() => setActiveTab('invoices')}
             className={`py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
               activeTab === 'invoices'
                 ? 'border-purple-500 text-purple-600'
                 : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
             }`}
           >
             Invoices
           </button>
           <button
             onClick={() => setActiveTab('settings')}
             className={`py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
               activeTab === 'settings'
                 ? 'border-purple-500 text-purple-600'
                 : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
             }`}
           >
             Client Settings
           </button>
         </div>
       </div>

             {/* Content */}
       <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
        {message && (
          <div className={`mb-4 p-3 rounded-md text-sm ${
            message.includes('successfully') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

                 {activeTab === 'requests' && (
           <div className="bg-white rounded-lg border border-gray-200 p-6">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-medium text-gray-900">Requests</h3>
               <button className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">
                 Create Request
               </button>
             </div>

                           {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-600">Active Requests</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-600">Completed Requests</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 sm:col-span-2 lg:col-span-1">
                  <div className="text-2xl font-bold text-gray-900">-</div>
                  <div className="text-sm text-gray-600">Average rating</div>
                </div>
              </div>

                           {/* Search and Filter Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
                <div className="flex-1 relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search requests..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                    <Filter size={16} />
                    Filters
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                    <Grid size={16} />
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                    <List size={16} />
                    List
                  </button>
                </div>
              </div>

             {/* Empty State */}
             <div className="text-center py-12">
               <div className="flex justify-center mb-4">
                 <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                   <FileText className="text-gray-400" size={32} />
                 </div>
               </div>
               <h3 className="text-lg font-medium text-gray-900 mb-2">No Requests yet</h3>
               <p className="text-gray-500 mb-6">Get started by creating a new Request.</p>
               <button className="px-6 py-3 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">
                 Create Request
               </button>
             </div>
           </div>
         )}

                 {activeTab === 'invoices' && (
           <div className="bg-white rounded-lg border border-gray-200 p-6">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-medium text-gray-900">Invoices</h3>
               <button className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">
                 Create Invoice
               </button>
             </div>

                           {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-600">Total Invoices</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-2xl font-bold text-gray-900">$0</div>
                  <div className="text-sm text-gray-600">Total Amount</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 sm:col-span-2 lg:col-span-1">
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
              </div>

                           {/* Search and Filter Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
                <div className="flex-1 relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search invoices..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                    <Filter size={16} />
                    Filters
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                    <Grid size={16} />
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                    <List size={16} />
                    List
                  </button>
                </div>
              </div>

             {/* Empty State */}
             <div className="text-center py-12">
               <div className="flex justify-center mb-4">
                 <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                   <FileText className="text-gray-400" size={32} />
                 </div>
               </div>
               <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices yet</h3>
               <p className="text-gray-500 mb-6">Get started by creating a new Invoice.</p>
               <button className="px-6 py-3 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">
                 Create Invoice
               </button>
             </div>
           </div>
         )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Client Settings</h3>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                >
                  <Edit size={16} />
                  Edit Client
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveClient}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setEditForm({
                        name: client.name || '',
                        email: client.email || '',
                        client_company_name: client.client_company_name || ''
                      })
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Client Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Client Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{client.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    {editing ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{client.email || 'Not provided'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={editForm.client_company_name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, client_company_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        placeholder="Individual"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{client.client_company_name || 'Individual'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Created Date
                    </label>
                    <p className="text-sm text-gray-900">{formatDate(client.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Password Reset */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Reset Password</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff size={16} className="text-gray-400" />
                        ) : (
                          <Eye size={16} className="text-gray-400" />
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Minimum 6 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={16} className="text-gray-400" />
                        ) : (
                          <Eye size={16} className="text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <button
                    onClick={handleResetPassword}
                    disabled={saving || !passwordForm.newPassword || !passwordForm.confirmPassword}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {saving ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
