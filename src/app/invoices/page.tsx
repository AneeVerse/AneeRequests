"use client"
import { useState, useEffect } from "react"
import { Filter, LayoutGrid, ChevronDown, Plus } from "lucide-react"
import Link from "next/link"

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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/invoices')
      
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
  }

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
      case 'pending': return 'text-yellow-700 bg-yellow-100'
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Invoices</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/invoices/new"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
          >
            <Plus size={16} />
            Create invoice
          </Link>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
            <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
              <Filter size={16} />
              Filters
            </button>
            <button className="p-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-md">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
            <div className="col-span-2">NUMBER</div>
            <div className="col-span-3">ORGANIZATION</div>
            <div className="col-span-2">PAYMENT METHOD</div>
            <div className="col-span-2">STATUS</div>
            <div className="col-span-2">CREATED</div>
            <div className="col-span-1">TOTAL</div>
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
                className="mt-2 text-sm text-purple-600 hover:text-purple-700"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && invoices.length === 0 && (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-500 mb-4">No invoices found</div>
              <Link
                href="/invoices/new"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
              >
                <Plus size={16} />
                Create your first invoice
              </Link>
            </div>
          )}

          {/* Table Rows */}
          {!loading && !error && invoices.map((invoice) => (
            <Link
              key={invoice.id}
              href={`/invoices/${invoice.id}`}
              className="grid grid-cols-12 gap-4 px-4 py-4 text-sm border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
            >
              <div className="col-span-2">
                <div className="font-medium text-gray-900">{invoice.invoice_number}</div>
              </div>
              <div className="col-span-3">
                <div className="font-medium text-gray-900">
                  {invoice.client?.client_company?.name || invoice.client?.name || 'Unknown Client'}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-700">
                  {invoice.payment_method || '-'}
                </div>
              </div>
              <div className="col-span-2">
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                  • {getStatusDisplay(invoice.status)}
                </span>
              </div>
              <div className="col-span-2 text-gray-500">
                {formatDate(invoice.created_at)}
              </div>
              <div className="col-span-1">
                <div className="font-medium text-gray-900">
                  {formatCurrency(invoice.total)}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        {!loading && !error && invoices.length > 0 && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-gray-500">
              Showing 1 to {invoices.length} of {invoices.length} result{invoices.length !== 1 ? 's' : ''}
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
