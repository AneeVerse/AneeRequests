"use client"
import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Download, Mail, CheckCircle, Trash2, Edit } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/AuthContext"
import RouteGuard from "@/components/RouteGuard"
import PermissionGate from "@/components/PermissionGate"

interface Client {
  id: string
  name: string
  email?: string
  client_company_name?: string
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
  currency?: string
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
  const searchParams = useSearchParams()
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
      currency: invoice?.currency || 'USD'
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

  const buildPrintableHtml = (invoice: Invoice) => {
    const formatCurrencyForHtml = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: invoice.currency || 'USD'
      }).format(amount)
    }

    const lineItemsRows = invoice.line_items.map(item => `
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;vertical-align:top;">${item.description}</td>
        <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;text-align:right;vertical-align:top;">${formatCurrencyForHtml(item.rate)}</td>
        <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;text-align:right;vertical-align:top;">${item.quantity}</td>
        <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;text-align:right;vertical-align:top;font-weight:600;">${formatCurrencyForHtml(item.line_total)}</td>
      </tr>
    `).join('')

    return `<!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoice_number}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
          color: #1f2937; 
          background: #ffffff;
          line-height: 1.6;
        }
        .container { 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 40px 30px; 
          background: #ffffff;
        }
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
          margin-bottom: 40px;
          padding-bottom: 30px;
          border-bottom: 3px solid #073742;
        }
        .company-info h1 {
          font-size: 32px;
          font-weight: 700;
          color: #073742;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        .company-info .tagline {
          color: #6b7280;
          font-size: 16px;
          font-weight: 500;
        }
        .invoice-details {
          text-align: right;
        }
        .invoice-number {
          font-size: 28px;
          font-weight: 700;
          color: #073742;
          margin-bottom: 8px;
        }
        .invoice-date {
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
        }
        .client-section {
          margin-bottom: 40px;
          padding: 25px;
          background: linear-gradient(135deg, #f0f7f9 0%, #e1eff4 100%);
          border-radius: 12px;
        }
        .client-section h3 {
          color: #073742;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .client-info {
          color: #374151;
          font-size: 16px;
          line-height: 1.8;
        }
        .client-info strong {
          color: #073742;
          font-weight: 600;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .items-table thead {
          background: linear-gradient(135deg, #073742 0%, #0f7fa7 100%);
        }
        .items-table th {
          font-size: 12px;
          text-transform: uppercase;
          color: #ffffff;
          text-align: left;
          padding: 20px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .items-table th:last-child {
          text-align: right;
        }
        .items-table tbody tr:nth-child(even) {
          background: #f9fafb;
        }
        .items-table tbody tr:hover {
          background: #f0f7f9;
        }
        .items-table tfoot {
          background: #f8fafc;
          border-top: 2px solid #073742;
        }
        .items-table tfoot td {
          font-weight: 600;
          padding: 20px;
        }
        .items-table tfoot td:last-child {
          text-align: right;
          font-size: 18px;
          color: #073742;
        }
        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }
        .totals-box {
          background: linear-gradient(135deg, #f0f7f9 0%, #e1eff4 100%);
          padding: 25px 30px;
          border-radius: 12px;
          border: 2px solid #073742;
          min-width: 300px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 16px;
        }
        .total-row.final {
          border-top: 2px solid #073742;
          padding-top: 15px;
          margin-top: 15px;
          font-size: 20px;
          font-weight: 700;
          color: #073742;
        }
        .notes-section {
          background: #f8fafc;
          padding: 25px;
          border-radius: 12px;
        }
        .notes-section h3 {
          color: #073742;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .notes-content {
          color: #374151;
          font-size: 16px;
          line-height: 1.8;
          white-space: pre-wrap;
        }
        .footer {
          margin-top: 50px;
          padding-top: 30px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 20px;
        }
        .status-${invoice.status} {
          background: ${invoice.status === 'paid' ? '#dcfce7' : invoice.status === 'pending' ? '#fef3c7' : '#fee2e2'};
          color: ${invoice.status === 'paid' ? '#166534' : invoice.status === 'pending' ? '#92400e' : '#991b1b'};
        }
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .container { margin: 0; padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-info">
            <h1>AneeRequests</h1>
            <div class="tagline">Professional Request Management</div>
          </div>
          <div class="invoice-details">
            <div class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</div>
            <div class="invoice-number">${invoice.invoice_number}</div>
            <div class="invoice-date">Date of Issue: ${new Date(invoice.date_of_issue).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            ${invoice.due_date ? `<div class="invoice-date" style="margin-top: 8px;">Due Date: ${new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>` : ''}
          </div>
        </div>

        <div class="client-section">
          <h3>Bill To</h3>
          <div class="client-info">
            <div><strong>${invoice.client?.name || 'N/A'}</strong></div>
            ${invoice.client?.client_company_name ? `<div>${invoice.client.client_company_name}</div>` : ''}
            ${invoice.client?.email ? `<div>${invoice.client.email}</div>` : ''}
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align:right;">Rate</th>
              <th style="text-align:right;">Quantity</th>
              <th style="text-align:right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align:right; font-weight:600; color: #073742;">Total</td>
              <td style="text-align:right; font-weight:700; color: #073742; font-size: 18px;">${formatCurrencyForHtml(invoice.total)}</td>
            </tr>
          </tfoot>
        </table>

        ${invoice.notes ? `
        <div class="notes-section">
          <h3>Notes</h3>
          <div class="notes-content">${invoice.notes.replace(/</g,'&lt;')}</div>
        </div>
        ` : ''}

        <div class="footer">
          <p>Thank you for your business! | Powered by AneeRequests</p>
          <p style="margin-top: 8px; font-size: 12px;">This is a computer-generated invoice.</p>
        </div>
      </div>
      <script>window.onload = () => { setTimeout(() => window.print(), 300) }</script>
    </body>
    </html>`
  }

  const handleDownload = () => {
    if (!invoice) return
    const html = buildPrintableHtml(invoice)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice-${invoice.invoice_number}.html`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  // Auto-download when navigated with ?download=1
  useEffect(() => {
    if (invoice && searchParams?.get('download') === '1') {
      handleDownload()
    }
  }, [invoice, searchParams])

  if (loading) {
    return (
      <RouteGuard requireAnyPermission={['view_invoices', 'edit_invoices', 'delete_invoices']}>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading invoice...</div>
        </div>
      </RouteGuard>
    )
  }

     if (error || !invoice) {
     return (
       <RouteGuard requireAnyPermission={['view_invoices', 'edit_invoices', 'delete_invoices']}>
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
    <RouteGuard requireAnyPermission={['view_invoices', 'edit_invoices', 'delete_invoices']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center space-x-4">
                <Link
                  href="/invoices"
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={18} />
                  Back to invoices
                </Link>
                <div className="h-6 w-px bg-gray-300"></div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Invoice {invoice.invoice_number}
                  </h1>
                  <p className="text-xs text-gray-500 mt-1">
                    Issued on {formatDate(invoice.date_of_issue)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                  <span className="w-1.5 h-1.5 bg-current rounded-full mr-1.5"></span>
                  {getStatusDisplay(invoice.status)}
                </span>
                
                <div className="flex items-center space-x-2">
                  <PermissionGate permission="edit_invoices">
                    <Link
                      href={`/invoices/${invoice.id}/edit`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all"
                    >
                      <Edit size={14} />
                      Edit
                    </Link>
                  </PermissionGate>
                  <button 
                    onClick={handleDownload} 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
                  >
                    <Download size={14} />
                    Download
                  </button>
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all">
                    <Mail size={14} />
                    Send
                  </button>
                  <PermissionGate permission="edit_invoices">
                    {invoice.status !== 'paid' && (
                      <button
                        onClick={handleMarkAsPaid}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 hover:border-green-300 transition-all"
                      >
                        <CheckCircle size={14} />
                        Mark as paid
                      </button>
                    )}
                  </PermissionGate>
                  <PermissionGate permission="delete_invoices">
                    <button
                      onClick={handleDeleteInvoice}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 transition-all"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </PermissionGate>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Invoice Details & Client Info */}
            <div className="xl:col-span-2 space-y-8">
              {/* Invoice Details Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-3 bg-gradient-to-r from-primary-50 to-primary-100 border-b border-gray-200">
                  <h2 className="text-base font-semibold text-primary-900">Invoice Details</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Invoice Number</label>
                        <p className="text-sm font-semibold text-gray-900">{invoice.invoice_number}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Date of Issue</label>
                        <p className="text-sm text-gray-900">{formatDate(invoice.date_of_issue)}</p>
                      </div>
                      {invoice.due_date && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Due Date</label>
                          <p className="text-sm text-gray-900">{formatDate(invoice.due_date)}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      {invoice.payment_method && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Payment Method</label>
                          <p className="text-sm text-gray-900 capitalize">{invoice.payment_method.replace('_', ' ')}</p>
                        </div>
                      )}
                      {invoice.payment_reference && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Payment Reference</label>
                          <p className="text-sm text-gray-900">{invoice.payment_reference}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Information Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-3 bg-gradient-to-r from-primary-50 to-primary-100 border-b border-gray-200">
                  <h2 className="text-base font-semibold text-primary-900">Bill To</h2>
                </div>
                <div className="p-6">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      {invoice.client?.name || 'N/A'}
                    </h3>
                    {invoice.client?.client_company_name && (
                      <p className="text-xs text-gray-600 mb-1">{invoice.client.client_company_name}</p>
                    )}
                    {invoice.client?.email && (
                      <p className="text-xs text-gray-600">{invoice.client.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Line Items Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-3 bg-gradient-to-r from-primary-50 to-primary-100 border-b border-gray-200">
                  <h2 className="text-base font-semibold text-primary-900">Line Items</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Rate</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {invoice.line_items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="text-xs font-medium text-gray-900">{item.description}</p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-xs text-gray-600">
                            {formatCurrency(item.rate)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-xs text-gray-600">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-semibold text-gray-900">
                            {formatCurrency(item.line_total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes Card */}
              {invoice.notes && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-3 bg-gradient-to-r from-primary-50 to-primary-100 border-b border-gray-200">
                  <h2 className="text-base font-semibold text-primary-900">Notes</h2>
                </div>
                  <div className="p-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{invoice.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Summary */}
            <div className="xl:col-span-1">
              <div className="sticky top-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700">
                    <h2 className="text-base font-semibold text-white">Summary</h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs font-medium text-gray-600">Subtotal</span>
                        <span className="text-xs font-semibold text-gray-900">{formatCurrency(invoice.subtotal)}</span>
                      </div>
                      {invoice.tax_amount > 0 && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-xs font-medium text-gray-600">Tax</span>
                          <span className="text-xs font-semibold text-gray-900">{formatCurrency(invoice.tax_amount)}</span>
                        </div>
                      )}
                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-900">Total</span>
                          <span className="text-base font-bold text-primary-600">{formatCurrency(invoice.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}
