"use client"
import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Download, Mail, CheckCircle, Trash2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/AuthContext"
import RouteGuard from "@/components/RouteGuard"

interface Client {
  id: string
  name: string
  email?: string
  client_company?: {
    name: string
  }
}

interface LineItem {
  description: string
  rate: number
  quantity: number
  line_total: number
}

interface Invoice {
  id: string
  invoice_number: string
  client_id: string
  client?: Client
  date_of_issue: string
  due_date?: string
  payment_method?: string
  payment_reference?: string
  status: string
  line_items: LineItem[]
  subtotal: number
  tax_amount: number
  total: number
  notes?: string
  created_at: string
  updated_at: string
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadInvoice = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/invoices/${params.id}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch invoice')
      }
      
      const data = await response.json()
      setInvoice(data)
    } catch (err) {
      console.error('Error loading invoice:', err)
      setError(err instanceof Error ? err.message : 'Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    loadInvoice()
  }, [loadInvoice])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
      case 'sent': return 'text-orange-700 bg-orange-100'
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

  const handleMarkAsPaid = async () => {
    if (!invoice) return

    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'paid' }),
      })

      if (!response.ok) {
        throw new Error('Failed to update invoice')
      }

      setInvoice(prev => prev ? { ...prev, status: 'paid' } : null)
    } catch (err) {
      console.error('Error updating invoice:', err)
      alert('Failed to update invoice')
    }
  }

  const handleDeleteInvoice = async () => {
    if (!invoice || !confirm('Are you sure you want to delete this invoice?')) {
      return
    }

    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete invoice')
      }

      router.push('/invoices')
    } catch (err) {
      console.error('Error deleting invoice:', err)
      alert('Failed to delete invoice')
    }
  }

  if (loading) {
    return (
      <RouteGuard>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading invoice...</div>
        </div>
      </RouteGuard>
    )
  }

     if (error || !invoice) {
     return (
       <RouteGuard>
         <div className="flex flex-col items-center justify-center h-full gap-4">
           <div className="text-red-600 text-center">{error || 'Invoice not found'}</div>
           <button
             onClick={loadInvoice}
             className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
           >
             Try again
           </button>
         </div>
       </RouteGuard>
     )
   }

  return (
    <RouteGuard>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Link
              href="/invoices"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={16} />
              Back to invoices
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Invoice {invoice.invoice_number}
              </h1>
              <p className="text-sm text-gray-500">
                {formatDate(invoice.date_of_issue)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(invoice.status)}`}>
              <span className="w-2 h-2 bg-current rounded-full mr-2"></span>
              {getStatusDisplay(invoice.status)}
            </span>
            
            {user?.role !== 'client' && (
              <>
                <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  <Download size={16} />
                  Download
                </button>
                <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  <Mail size={16} />
                  Send
                </button>
                {invoice.status !== 'paid' && (
                  <button
                    onClick={handleMarkAsPaid}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100"
                  >
                    <CheckCircle size={16} />
                    Mark as paid
                  </button>
                )}
                <button
                  onClick={handleDeleteInvoice}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-6 py-6">
            {/* Invoice Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* From/To Section */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Details</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Invoice Number:</span>
                      <p className="text-gray-900">{invoice.invoice_number}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Date of Issue:</span>
                      <p className="text-gray-900">{formatDate(invoice.date_of_issue)}</p>
                    </div>
                    {invoice.due_date && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Due Date:</span>
                        <p className="text-gray-900">{formatDate(invoice.due_date)}</p>
                      </div>
                    )}
                    {invoice.payment_method && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Payment Method:</span>
                        <p className="text-gray-900">{invoice.payment_method}</p>
                      </div>
                    )}
                    {invoice.payment_reference && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Payment Reference:</span>
                        <p className="text-gray-900">{invoice.payment_reference}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Bill To</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900">
                      {invoice.client?.name}
                    </p>
                    {invoice.client?.client_company?.name && (
                      <p className="text-gray-600">{invoice.client.client_company.name}</p>
                    )}
                    {invoice.client?.email && (
                      <p className="text-gray-600">{invoice.client.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    {invoice.tax_amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax:</span>
                        <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-semibold border-t pt-3">
                      <span>Total:</span>
                      <span>{formatCurrency(invoice.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Line Items</h3>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                  <div className="col-span-6">DESCRIPTION</div>
                  <div className="col-span-2 text-right">RATE</div>
                  <div className="col-span-2 text-right">QUANTITY</div>
                  <div className="col-span-2 text-right">AMOUNT</div>
                </div>
                
                {invoice.line_items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-200 last:border-b-0">
                    <div className="col-span-6">
                      <p className="text-gray-900">{item.description}</p>
                    </div>
                    <div className="col-span-2 text-right text-gray-600">
                      {formatCurrency(item.rate)}
                    </div>
                    <div className="col-span-2 text-right text-gray-600">
                      {item.quantity}
                    </div>
                    <div className="col-span-2 text-right font-medium">
                      {formatCurrency(item.line_total)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}
