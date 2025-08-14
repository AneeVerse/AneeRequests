"use client"
import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"
import RouteGuard from "@/components/RouteGuard"

interface Client {
  id: string
  name: string
  email?: string
  client_company_name?: string
  created_at: string
}

export default function ClientDetailPage() {
  const params = useParams()
  const clientId = params.id as string
  
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    loadClient()
  }, [loadClient])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                >
                  <Edit size={16} />
                  Edit Client
          </Link>
            </div>

        {/* Content */}
        <div className="flex-1 p-6">
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
          </div>
      </div>
    </RouteGuard>
  )
}
