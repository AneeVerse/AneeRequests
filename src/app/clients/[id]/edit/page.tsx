"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Client {
  id: string
  name: string
  email?: string
  client_company?: {
    name: string
  }
}

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return <EditClientPageClient clientId={id} />
}

function EditClientPageClient({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    client_company_name: ""
  })

  const loadClient = async () => {
    try {
      setInitialLoading(true)
      const response = await fetch(`/api/clients/${clientId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch client')
      }
      
      const clientData = await response.json()
      setClient(clientData)
      setFormData({
        name: clientData.name || "",
        email: clientData.email || "",
        client_company_name: clientData.client_company?.name || ""
      })
    } catch (err) {
      console.error('Error loading client:', err)
      setError('Failed to load client')
    } finally {
      setInitialLoading(false)
    }
  }

  useEffect(() => {
    loadClient()
  }, [clientId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!formData.name.trim()) {
      setError("Client name is required")
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update client')
      }
      
      // Success - redirect back to clients page
      router.push('/clients')
    } catch (err) {
      console.error('Error updating client:', err)
      setError(err instanceof Error ? err.message : 'Failed to update client')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (initialLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Link 
              href="/clients"
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Edit Client</h1>
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="text-center text-gray-500">Loading client...</div>
        </div>
      </div>
    )
  }

  if (error && !client) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Link 
              href="/clients"
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Edit Client</h1>
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="text-center text-red-600">{error}</div>
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link 
            href="/clients"
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Edit Client</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="max-w-2xl">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Client Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">Optional - for contact purposes</p>
              </div>

              {/* Company Name */}
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  id="company"
                  type="text"
                  value={formData.client_company_name}
                  onChange={(e) => handleInputChange('client_company_name', e.target.value)}
                  placeholder="ACME Corporation"
                  className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Optional - leave empty for individual clients. New companies will be created automatically.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <Link
                  href="/clients"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
