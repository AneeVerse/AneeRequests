"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { Filter, LayoutGrid, ChevronDown, Plus, X, Search, MoreHorizontal, Eye, Download, CheckCircle, Mail, Link as LinkIcon, Trash2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/AuthContext"
import RouteGuard from "@/components/RouteGuard"
import { ClientUser } from "@/lib/types/auth"

interface Client {
  id: string
  name: string
  client_company?: {
    name: string
  }
}

interface Invoice {
  id: string
  invoice_number: string
  client_id: string
  client?: Client
  payment_method?: string
  status: string
  total: number
  created_at: string
  updated_at: string
}

interface FilterState {
  search: string
  status: string
  paymentMethod: string
  createdDate: string
  totalRange: string
}

export default function InvoicesPage() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Filter state
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    paymentMethod: '',
    createdDate: '',
    totalRange: ''
  })

  // Load invoices function
  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true)
      
      // Build URL with client filter if user is a client
      let url = '/api/invoices'
      if (user?.role === 'client' && (user as ClientUser)?.clientId) {
        const clientId = (user as ClientUser).clientId
        if (clientId) {
          url += `?client_id=${encodeURIComponent(clientId)}`
        }
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoices')
      }
      
      const data = await response.json()
      setInvoices(data)
    } catch (err) {
      console.error('Error loading invoices:', err)
      setError('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Filter invoices based on search and filters
  const filterInvoices = useCallback(() => {
    let filtered = invoices

    // Apply search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim()
      filtered = filtered.filter(invoice => 
        invoice.invoice_number.toLowerCase().includes(searchTerm) ||
        invoice.client?.name.toLowerCase().includes(searchTerm) ||
        invoice.client?.client_company?.name.toLowerCase().includes(searchTerm) ||
        invoice.payment_method?.toLowerCase().includes(searchTerm)
      )
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(invoice => invoice.status === filters.status)
    }

    // Apply payment method filter
    if (filters.paymentMethod) {
      filtered = filtered.filter(invoice => invoice.payment_method === filters.paymentMethod)
    }

    // Apply created date filter
    if (filters.createdDate) {
      const createdDate = new Date(filters.createdDate)
      filtered = filtered.filter(invoice => {
        const invoiceCreatedDate = new Date(invoice.created_at)
        return invoiceCreatedDate.toDateString() === createdDate.toDateString()
      })
    }

    // Apply total range filter
    if (filters.totalRange) {
      const [min, max] = filters.totalRange.split('-').map(Number)
      filtered = filtered.filter(invoice => {
        if (max) {
          return invoice.total >= min && invoice.total <= max
        } else {
          return invoice.total >= min
        }
      })
    }

    setFilteredInvoices(filtered)
  }, [invoices, filters])

  // Apply filters whenever invoices or filters change
  useEffect(() => {
    filterInvoices()
  }, [invoices, filters, filterInvoices])

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      paymentMethod: '',
      createdDate: '',
      totalRange: ''
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
    loadInvoices()
  }, [loadInvoices])

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-orange-700 bg-orange-100'
      case 'paid': return 'text-green-700 bg-green-100'
      case 'overdue': return 'text-red-700 bg-red-100'
      case 'draft': return 'text-gray-700 bg-gray-100'
      case 'cancelled': return 'text-gray-700 bg-gray-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  const getStatusDisplay = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const toggleMenu = (invoiceId: string) => {
    setOpenMenuId(openMenuId === invoiceId ? null : invoiceId)
  }

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'paid' }),
      })

      if (!response.ok) {
        throw new Error('Failed to update invoice')
      }

      // Update the invoice in the list
      setInvoices(prev => prev.map(invoice => 
        invoice.id === invoiceId 
          ? { ...invoice, status: 'paid' }
          : invoice
      ))
      setOpenMenuId(null)
    } catch (err) {
      console.error('Error updating invoice:', err)
      alert('Failed to update invoice')
    }
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return
    }

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete invoice')
      }

      // Remove the invoice from the list
      setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId))
      setOpenMenuId(null)
    } catch (err) {
      console.error('Error deleting invoice:', err)
      alert('Failed to delete invoice')
    }
  }

  return (
    <RouteGuard>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
              {user?.role === 'client' ? 'My Invoices' : 'Invoices'}
            </h1>
            {user?.role === 'client' && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                Client View
              </span>
            )}
          </div>
          {user?.role !== 'client' && (
            <div className="flex items-center gap-3">
              <Link
                href="/invoices/new"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Create Invoice</span>
                <span className="sm:hidden">Create</span>
              </Link>
            </div>
          )}
        </div>

        {/* Search and Controls */}
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search invoices, numbers, clients..."
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

          {/* Filter Panel */}
          {showFilters && (
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                  >
                    <option value="">All statuses</option>
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Payment Method Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={filters.paymentMethod}
                    onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                  >
                    <option value="">All methods</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="paypal">PayPal</option>
                    <option value="check">Check</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>

                {/* Created Date Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Created Date</label>
                  <input
                    type="date"
                    value={filters.createdDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, createdDate: e.target.value }))}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>

                {/* Total Range Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Total Range</label>
                  <select
                    value={filters.totalRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, totalRange: e.target.value }))}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                  >
                    <option value="">All amounts</option>
                    <option value="0-100">$0 - $100</option>
                    <option value="100-500">$100 - $500</option>
                    <option value="500-1000">$500 - $1,000</option>
                    <option value="1000-5000">$1,000 - $5,000</option>
                    <option value="5000-">$5,000+</option>
                  </select>
                </div>
              </div>
            </div>
          )}

                                               {/* Desktop Table */}
              <div className="hidden lg:block bg-white rounded-lg border border-gray-200">
                {/* Table Header */}
                <div className="flex items-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-200">
                  <div className="w-64 flex items-center gap-2">
                    NUMBER
                    <button>
                      <ChevronDown size={12} className="text-gray-400" />
                    </button>
                  </div>
                  <div className="w-64">ORGANIZATION</div>
                  <div className="w-55">PAYMENT METHOD</div>
                  <div className="w-32">STATUS</div>
                  <div className="w-32 flex items-center gap-2">
                    CREATED
                    <button>
                      <ChevronDown size={12} className="text-gray-400" />
                    </button>
                  </div>
                  <div className="w-24 flex items-center gap-2">
                    TOTAL
                    <button>
                      <ChevronDown size={12} className="text-gray-400" />
                    </button>
                  </div>
                  <div className="w-16"></div>
                </div>

            {/* Loading State */}
            {loading && (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-500">Loading invoices...</div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="px-6 py-12 text-center">
                <div className="text-red-600">{error}</div>
                <button 
                  onClick={loadInvoices}
                  className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredInvoices.length === 0 && invoices.length === 0 && (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-500 mb-4">
                  {user?.role === 'client' ? 'No invoices found for your account' : 'No invoices found'}
                </div>
                {user?.role !== 'client' && (
                  <Link
                    href="/invoices/new"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                  >
                    <Plus size={16} />
                    Create your first invoice
                  </Link>
                )}
              </div>
            )}

            {/* Empty State - No Invoices Matching Filter */}
            {!loading && !error && filteredInvoices.length === 0 && invoices.length > 0 && (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-500 mb-4">
                  {hasActiveFilters() ? 'No invoices match your filters' : 'No invoices found'}
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

                                                   {/* Desktop Table Rows */}
              {!loading && !error && filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="hidden lg:flex items-center px-6 py-3 text-xs border-b border-gray-200 hover:bg-gray-50">
                  <div className="w-132">
                    <div className="font-medium text-gray-900">{invoice.invoice_number}</div>
                  </div>
                  <div className="w-182">
                    <div className="text-gray-900">
                      {invoice.client?.client_company?.name || invoice.client?.name || 'N/A'}
                    </div>
                  </div>
                  <div className="w-60">
                    <div className="text-gray-500">
                      {invoice.payment_method ? invoice.payment_method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '-'}
                    </div>
                  </div>
                  <div className="w-62">
                    <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                      <span className="w-1 h-1 bg-current rounded-full mr-1"></span>
                      {getStatusDisplay(invoice.status)}
                    </span>
                  </div>
                  <div className="w-68 text-gray-500">
                    {formatDate(invoice.created_at)}
                  </div>
                  <div className="w-32 text-gray-900 font-medium">
                    {formatCurrency(invoice.total)}
                  </div>
                                     <div className="w-60 flex justify-end relative pr-2">
                     <button 
                       onClick={() => toggleMenu(invoice.id)}
                       className="p-1 text-gray-400 hover:text-gray-600"
                     >
                       <MoreHorizontal size={16} />
                     </button>
                    
                    {openMenuId === invoice.id && (
                      <div 
                        ref={(el) => { menuRefs.current[invoice.id] = el }}
                        className="absolute right-0 top-8 z-10 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1"
                      >
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setOpenMenuId(null)}
                      >
                        <Eye size={16} />
                        View
                      </Link>
                      <button
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setOpenMenuId(null)
                          // Download functionality would go here
                        }}
                      >
                        <Download size={16} />
                        Download
                      </button>
                      {user?.role !== 'client' && invoice.status !== 'paid' && (
                        <button
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            setOpenMenuId(null)
                            handleMarkAsPaid(invoice.id)
                          }}
                        >
                          <CheckCircle size={16} />
                          Mark as paid
                        </button>
                      )}
                      <button
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setOpenMenuId(null)
                          // Request payment functionality would go here
                        }}
                      >
                        <Mail size={16} />
                        Request payment by email
                      </button>
                      <button
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setOpenMenuId(null)
                          // Get payment link functionality would go here
                        }}
                      >
                        <LinkIcon size={16} />
                        Get payment link
                      </button>
                      {user?.role !== 'client' && (
                        <button
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setOpenMenuId(null)
                            handleDeleteInvoice(invoice.id)
                          }}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
                             </div>
             ))}
           </div>

           {/* Mobile Card View */}
           <div className="lg:hidden space-y-3">
             {!loading && !error && filteredInvoices.map((invoice) => (
                               <div key={invoice.id} className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
                 <div className="flex items-start justify-between">
                   <div className="flex-1">
                                           <div className="font-medium text-gray-900 text-xs">{invoice.invoice_number}</div>
                      <div className="text-gray-500 text-xs">
                       {invoice.client?.client_company?.name || invoice.client?.name || 'N/A'}
                     </div>
                   </div>
                   <div className="flex items-center gap-2">
                                           <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                        <span className="w-1 h-1 bg-current rounded-full mr-1"></span>
                        {getStatusDisplay(invoice.status)}
                      </span>
                     <button 
                       onClick={() => toggleMenu(invoice.id)}
                       className="p-1 text-gray-400 hover:text-gray-600"
                     >
                       <MoreHorizontal size={16} />
                     </button>
                   </div>
                 </div>
                 
                                   <div className="flex items-center justify-between text-xs">
                   <div className="text-gray-500">
                     {invoice.payment_method ? invoice.payment_method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '-'}
                   </div>
                   <div className="font-medium text-gray-900">
                     {formatCurrency(invoice.total)}
                   </div>
                 </div>
                 
                                   <div className="text-xs text-gray-500">
                   Created {formatDate(invoice.created_at)}
                 </div>
                 
                 {/* Mobile Menu */}
                 {openMenuId === invoice.id && (
                   <div className="border-t border-gray-100 pt-3 mt-3">
                     <div className="space-y-1">
                       <Link
                         href={`/invoices/${invoice.id}`}
                         className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                         onClick={() => setOpenMenuId(null)}
                       >
                         <Eye size={16} />
                         View
                       </Link>
                       <button
                         className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                         onClick={() => {
                           setOpenMenuId(null)
                           // Download functionality would go here
                         }}
                       >
                         <Download size={16} />
                         Download
                       </button>
                       {user?.role !== 'client' && invoice.status !== 'paid' && (
                         <button
                           className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                           onClick={() => {
                             setOpenMenuId(null)
                             handleMarkAsPaid(invoice.id)
                           }}
                         >
                           <CheckCircle size={16} />
                           Mark as paid
                         </button>
                       )}
                       <button
                         className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                         onClick={() => {
                           setOpenMenuId(null)
                           // Request payment functionality would go here
                         }}
                       >
                         <Mail size={16} />
                         Request payment by email
                       </button>
                       <button
                         className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                         onClick={() => {
                           setOpenMenuId(null)
                           // Get payment link functionality would go here
                         }}
                       >
                         <LinkIcon size={16} />
                         Get payment link
                       </button>
                       {user?.role !== 'client' && (
                         <button
                           className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                           onClick={() => {
                             setOpenMenuId(null)
                             handleDeleteInvoice(invoice.id)
                           }}
                         >
                           <Trash2 size={16} />
                           Delete
                         </button>
                       )}
                     </div>
                   </div>
                 )}
               </div>
             ))}
           </div>

          {/* Footer */}
          {!loading && !error && filteredInvoices.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-3">
              <div className="text-sm text-gray-500 text-center sm:text-left">
                {filteredInvoices.length === 0 ? (
                  'No results found'
                ) : (
                  `Showing ${filteredInvoices.length} of ${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}`
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
      </div>
    </RouteGuard>
  )
}
