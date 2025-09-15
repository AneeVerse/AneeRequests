"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronDown, Plus, Trash2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import RouteGuard from "@/components/RouteGuard"

interface Client {
  id: string
  name: string
  email?: string
  client_company_name?: string
}

interface LineItem {
  id: string
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

export default function EditInvoicePage() {
  const params = useParams()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Invoice form data
  const [selectedClient, setSelectedClient] = useState("")
  const [dateOfIssue, setDateOfIssue] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [paymentReference, setPaymentReference] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [notes, setNotes] = useState("")
  
  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  
  // Calculations
  const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0)
  const total = subtotal

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [clientsResponse, invoiceResponse] = await Promise.all([
        fetch('/api/clients'),
        fetch(`/api/invoices/${params.id}`)
      ])
      
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json()
        setClients(clientsData)
      }

      if (invoiceResponse.ok) {
        const invoiceData = await invoiceResponse.json()
        setSelectedClient(invoiceData.client_id)
        setDateOfIssue(invoiceData.date_of_issue)
        setDueDate(invoiceData.due_date || "")
        setPaymentMethod(invoiceData.payment_method || "")
        setPaymentReference(invoiceData.payment_reference || "")
        setCurrency(invoiceData.currency || "USD")
        setNotes(invoiceData.notes || "")
        
        // Convert line items to include id for editing
        const itemsWithIds = invoiceData.line_items.map((item: any, index: number) => ({
          id: `item-${index}`,
          description: item.description,
          rate: item.rate,
          quantity: item.quantity,
          line_total: item.line_total
        }))
        setLineItems(itemsWithIds)
      }

    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: "",
      rate: 0,
      quantity: 1,
      line_total: 0
    }
    setLineItems([...lineItems, newItem])
  }

  const updateLineItem = (
    id: string,
    field: keyof LineItem,
    value: string | number
  ) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value } as LineItem
        
        // Recalculate line total
        if (field === 'rate' || field === 'quantity') {
          updatedItem.line_total = Number(updatedItem.rate) * Number(updatedItem.quantity)
        }
        
        return updatedItem
      }
      return item
    }))
  }

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id))
  }

  const handleSubmit = async (status: 'draft' | 'sent') => {
    if (!selectedClient) {
      alert('Please select a client')
      return
    }

    if (lineItems.length === 0) {
      alert('Please add at least one line item')
      return
    }

    // Validate line items
    const invalidItems = lineItems.filter(item => 
      !item.description.trim() || item.rate <= 0 || item.quantity <= 0
    )
    
    if (invalidItems.length > 0) {
      alert('Please complete all line items with valid description, rate, and quantity')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/invoices/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: selectedClient,
          date_of_issue: dateOfIssue,
          due_date: dueDate || undefined,
          payment_method: paymentMethod || undefined,
          payment_reference: paymentReference || undefined,
          currency,
          status,
          line_items: lineItems.map(item => ({
            description: item.description,
            rate: item.rate,
            quantity: item.quantity,
            line_total: item.line_total
          })),
          notes: notes || undefined
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Failed to update invoice')
      }
      
      router.push(`/invoices/${params.id}`)
    } catch (err) {
      console.error('Error updating invoice:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update invoice'
      alert(`Error: ${errorMessage}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <RouteGuard requireAdmin>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Link
              href={`/invoices/${params.id}`}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={16} />
              Back to invoice
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Edit Invoice</h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-6 py-6">
            {/* Invoice Details */}
            <div className="grid grid-cols-5 gap-6 mb-8">
              {/* Billed to */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billed to
                </label>
                <div className="relative">
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white text-gray-900"
                  >
                    <option value="">Add client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.client_company_name || 'Individual'})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Date of issue */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of issue
                </label>
                <input
                  type="date"
                  value={dateOfIssue}
                  onChange={(e) => setDateOfIssue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>

              {/* Due date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>

              {/* Payment method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment method
                </label>
                <input
                  type="text"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="-"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>

              {/* Payment reference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment reference
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="-"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                </select>
              </div>
            </div>

            {/* Line Items Section */}
            <div className="mb-8">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50 border border-gray-200 rounded-t-md">
                <div className="col-span-6">DESCRIPTION</div>
                <div className="col-span-2">RATE</div>
                <div className="col-span-2">QUANTITY</div>
                <div className="col-span-2">LINE TOTAL</div>
              </div>

              {/* Line Items */}
              <div className="border-l border-r border-gray-200">
                {lineItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-gray-200">
                    <div className="col-span-6">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        placeholder="Description"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          placeholder="1"
                          min="1"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                        />
                        <button
                          onClick={() => removeLineItem(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="px-3 py-2 text-gray-900 font-medium">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: currency || 'USD'
                        }).format(item.line_total)}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Line Item Button */}
                <div className="border-b border-gray-200">
                  <button
                    onClick={addLineItem}
                    className="w-full px-4 py-6 border-2 border-dashed border-primary-300 text-primary-600 hover:border-primary-400 hover:text-primary-700 flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Add line item
                  </button>
                </div>
              </div>

              {/* Totals */}
              <div className="border-l border-r border-b border-gray-200 rounded-b-md">
                <div className="flex justify-end px-4 py-4">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-900">{new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: currency || 'USD'
                      }).format(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-base font-medium border-t pt-2">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">{new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: currency || 'USD'
                      }).format(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <div className="border border-gray-300 rounded-md">
                {/* Rich Text Editor Toolbar */}
                <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50">
                  <button className="p-1 text-gray-600 hover:bg-gray-200 rounded font-bold">B</button>
                  <button className="p-1 text-gray-600 hover:bg-gray-200 rounded italic">I</button>
                  <button className="p-1 text-gray-600 hover:bg-gray-200 rounded underline">U</button>
                  <button className="p-1 text-gray-600 hover:bg-gray-200 rounded line-through">S</button>
                  <button className="p-1 text-gray-600 hover:bg-gray-200 rounded">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </button>
                  <button className="p-1 text-gray-600 hover:bg-gray-200 rounded">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  </button>
                  <button className="p-1 text-gray-600 hover:bg-gray-200 rounded">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                    </svg>
                  </button>
                  <button className="p-1 text-gray-600 hover:bg-gray-200 rounded">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2M7 4h6M7 4H6a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2h-1" />
                    </svg>
                  </button>
                  <button className="p-1 text-gray-600 hover:bg-gray-200 rounded">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  <button className="p-1 text-gray-600 hover:bg-gray-200 rounded">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 min-h-32 border-0 focus:outline-none focus:ring-0 resize-none text-gray-900"
                  placeholder="Add notes..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="text-xs text-gray-400">
                Powered by ManyRequests
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmit('draft')}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save as draft'}
                </button>
                <button
                  onClick={() => handleSubmit('sent')}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}
