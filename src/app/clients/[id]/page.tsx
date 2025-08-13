"use client"
import { useState, useEffect } from "react"
import { ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"

interface Client {
  id: string
  name: string
  email?: string
  created_at: string
  client_company?: {
    name: string
  }
}

export default async function ViewClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return <ViewClientPageClient clientId={id} />
}

function ViewClientPageClient({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [client, setClient] = useState<Client | null>(null)

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
    } catch (err) {
      console.error('Error loading client:', err)
      setError('Failed to load client')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
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
      <div className="flex flex-col h-full">
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
          <h1 className="text-xl font-semibold text-gray-900">Client Details</h1>
        </div>
        <Link
          href={`/clients/${client.id}/edit`}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
        >
          <Edit size={16} />
          Edit Client
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="max-w-2xl">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {/* Client Avatar and Basic Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-medium text-purple-600">{getInitials(client.name)}</span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{client.name}</h2>
                {client.email && (
                  <p className="text-gray-600">{client.email}</p>
                )}
              </div>
            </div>

            {/* Client Details */}
            <div className="space-y-4">
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Client Information</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900">{client.name}</p>
                  </div>
                  
                  {client.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Email Address</label>
                      <p className="mt-1 text-sm text-gray-900">{client.email}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Organization</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {client.client_company ? client.client_company.name : 'Individual'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Created</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(client.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
              <Link
                href="/clients"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Back to Clients
              </Link>
              <Link
                href={`/clients/${client.id}/edit`}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Edit Client
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
