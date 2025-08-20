"use client"
import { useState, useEffect, useRef } from "react"
import { Filter, LayoutGrid, ChevronDown, MoreHorizontal, Plus, Eye, Edit, UserCheck, ArrowRightLeft, Trash2, X, Search } from "lucide-react"
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

export default function ClientsPage() {
  const { user, impersonateClient } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
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
    <RouteGuard requireAdmin>
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
            Create Client Account
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
                    <Link 
                      href={`/clients/${client.id}`}
                      className="font-medium text-gray-900 hover:text-purple-600 transition-colors cursor-pointer"
                    >
                      {client.name}
                    </Link>
                    {client.email && (
                      <Link 
                        href={`/clients/${client.id}`}
                        className="text-gray-500 text-xs hover:text-purple-600 transition-colors cursor-pointer block"
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

       {/* Change Organization Modal */}
       {showChangeOrgModal && selectedClient && (
         <div 
           className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
           onClick={() => setShowChangeOrgModal(false)}
         >
                      <div 
             className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
             onClick={(e) => e.stopPropagation()}
           >
             {/* Modal Header */}
             <div className="flex items-center justify-between p-6 border-b border-gray-200">
               <h3 className="text-lg font-medium text-gray-900">
                 Change client to another organization
               </h3>
               <button
                 onClick={() => setShowChangeOrgModal(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <X size={20} />
               </button>
             </div>

             {/* Modal Body */}
             <div className="p-6">
               <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Organization
                 </label>
                 <select
                   value={selectedOrg}
                   onChange={(e) => setSelectedOrg(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
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
                     placeholder="Search..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                   />
                   <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                 </div>
               </div>

               {/* Organization List */}
               <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
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
                       className={`p-3 cursor-pointer hover:bg-gray-50 ${
                         selectedOrg === '' ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                       }`}
                       onClick={() => setSelectedOrg('')}
                     >
                       <div className="font-medium text-gray-900">Individual</div>
                       <div className="text-sm text-gray-500">No organization</div>
                     </div>
                     {filteredOrganizations.map((org) => (
                       <div
                         key={org._id}
                         className={`p-3 cursor-pointer hover:bg-gray-50 ${
                           selectedOrg === org.name ? 'bg-purple-50 border-l-4 border-purple-500' : ''
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
             <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
               <button
                 onClick={() => setShowChangeOrgModal(false)}
                 className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
               >
                 Cancel
               </button>
               <button
                 onClick={handleChangeOrganization}
                 disabled={changingOrg}
                 className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
             <div className="flex items-center justify-between p-6 border-b border-gray-200">
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
             <div className="p-6">
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
             <div className="flex gap-3 p-6 border-t border-gray-200">
               <button
                 onClick={() => setShowDeleteModal(false)}
                 className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
               >
                 Cancel
               </button>
               <button
                 onClick={confirmDeleteClient}
                 disabled={deletingClientId === clientToDelete.id}
                 className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
     </div>
     </RouteGuard>
   )
 }
