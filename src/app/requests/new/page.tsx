"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { useAuth } from "@/lib/contexts/AuthContext"
import { ClientUser } from "@/lib/types/auth"
import SimpleTextEditor from "@/components/SimpleTextEditor"

interface Client {
  id: string
  name: string
  email?: string
  client_company?: {
    name: string
  }
}

export default function CreateRequestPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [step, setStep] = useState(1)
  const [selectedClient, setSelectedClient] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("none")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showClientForm, setShowClientForm] = useState(false)
  const [newClientData, setNewClientData] = useState({
    name: "",
    email: "",
    client_company_name: ""
  })

  const [clients, setClients] = useState<Client[]>([])

  // Check for client_id in URL parameters and handle client role
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const clientId = urlParams.get('client_id')

    if (user?.role === 'client') {
      // For clients, use their clientId (not user.id) and go directly to step 2
      let actualClientId = (user as ClientUser).clientId
      // Handle impersonated client IDs (remove "impersonated-" prefix)
      if (actualClientId && actualClientId.startsWith('impersonated-')) {
        actualClientId = actualClientId.replace('impersonated-', '')
      }
      setSelectedClient(actualClientId)
      setStep(2)
    } else if (clientId && user?.role === 'admin') {
      // For admins with client_id parameter, set the client and go to step 2
      setSelectedClient(clientId)
      setStep(2)
    }
  }, [user?.role, (user as ClientUser)?.clientId])

  const loadInitialData = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  const handleClientSelect = (clientId: string) => {
    setSelectedClient(clientId)
  }

  const handleCreateClient = async () => {
    if (!newClientData.name.trim()) {
      setError("Client name is required")
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClientData),
      })

      if (!response.ok) {
        throw new Error('Failed to create client')
      }

      const newClient = await response.json()
      setClients(prev => [...prev, newClient])
      setSelectedClient(newClient.id)
      setShowClientForm(false)
      setNewClientData({ name: "", email: "", client_company_name: "" })
      setError(null)
    } catch (err) {
      console.error('Error creating client:', err)
      setError('Failed to create client. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (step === 1 && selectedClient) {
      setStep(2)
    }
  }

  const handleCreateRequest = async () => {
    if (!title || !description) {
      setError('Please fill in all required fields')
      return
    }

    // For clients, use their clientId (not user.id)
    let clientId = user?.role === 'client' ? (user as ClientUser).clientId : selectedClient

    // Handle impersonated client IDs (remove "impersonated-" prefix)
    if (clientId && clientId.startsWith('impersonated-')) {
      clientId = clientId.replace('impersonated-', '')
    }

    if (!clientId) {
      setError('Client information is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          priority,
          client_id: clientId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create request')
      }

      const newRequest = await response.json()
      
      // Check if we came from a client page and redirect back there
      const urlParams = new URLSearchParams(window.location.search)
      const urlClientId = urlParams.get('client_id')
      
      if (urlClientId) {
        // Redirect back to the client page, requests tab
        router.push(`/clients/${urlClientId}?tab=requests`)
      } else {
        // Default redirect to the request detail page
        router.push(`/requests/${newRequest.id}`)
      }
    } catch (err) {
      console.error('Error creating request:', err)
      setError('Failed to create request. Please try again.')
      setLoading(false)
    }
  }

  const handleExit = () => {
    router.push("/requests")
  }

  if (loading && step === 1) {
    return (
      <div className="min-h-screen bg-primary-600 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary-600 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? "bg-primary-300 text-primary-900" : "bg-primary-500 text-primary-200"
              }`}>
              {step >= 1 ? "✓" : "1"}
            </div>
            <div className={`w-16 h-0.5 ${step >= 2 ? "bg-primary-300" : "bg-primary-500"}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? "bg-primary-300 text-primary-900" : "bg-primary-500 text-primary-200 border-2 border-primary-400"
              }`}>
              2
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-8">
          <h1 className="text-2xl font-semibold text-gray-900 text-center mb-8">Create Request</h1>

          {/* Step 1: Client Selection (Admin only) */}
          {step === 1 && user?.role === 'admin' && !selectedClient && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Request information</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Client <span className="text-red-500">(Required)</span>
                  </label>

                  {!showClientForm ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <select
                          value={selectedClient}
                          onChange={(e) => handleClientSelect(e.target.value)}
                          className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white text-gray-900 text-base"
                        >
                          <option value="">Select a client...</option>
                          {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.name} ({client.client_company?.name || 'Individual'})
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
                      </div>

                      {clients.length === 0 && (
                        <div className="text-center py-4 bg-gray-50 rounded-md border-2 border-dashed border-gray-300">
                          <p className="text-sm text-gray-600 mb-2">No clients found</p>
                          <button
                            type="button"
                            onClick={() => setShowClientForm(true)}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Create your first client
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 p-4 bg-gray-50 rounded-md border">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">Add New Client</h4>
                        <button
                          type="button"
                          onClick={() => {
                            setShowClientForm(false)
                            setNewClientData({ name: "", email: "", client_company_name: "" })
                            setError(null)
                          }}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Client name *"
                          value={newClientData.name}
                          onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                        />
                      </div>

                      <div>
                        <input
                          type="email"
                          placeholder="Email (optional)"
                          value={newClientData.email}
                          onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Company name (optional)"
                          value={newClientData.client_company_name}
                          onChange={(e) => setNewClientData(prev => ({ ...prev, client_company_name: e.target.value }))}
                          className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleCreateClient}
                        disabled={loading || !newClientData.name.trim()}
                        className="w-full px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Creating...' : 'Create Client'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between pt-6">
                <button
                  onClick={handleExit}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={loading}
                >
                  Exit
                </button>
                <button
                  onClick={handleNext}
                  disabled={!selectedClient || loading}
                  className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Title and Description (or Step 1 for clients) */}
          {(step === 2 || (user?.role === 'client' && step === 1) || (user?.role === 'admin' && step === 1 && selectedClient)) && (
            <div>
              <div className="mb-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Title <span className="text-red-500">(Required)</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="Enter request title"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Description <span className="text-red-500">(Required)</span>
                  </label>
                  <div className="min-h-32">
                    <SimpleTextEditor
                      onSend={(content) => setDescription(content)}
                      placeholder="I am looking to create a display for my website..."
                      disabled={false}
                      sending={false}
                      variant="form"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  >
                    <option value="none">No Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between pt-6">
                {user?.role === 'admin' ? (
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={loading}
                  >
                    Back
                  </button>
                ) : (
                  <button
                    onClick={handleExit}
                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={loading}
                  >
                    Exit
                  </button>
                )}
                <button
                  onClick={handleCreateRequest}
                  disabled={!title || !description || loading}
                  className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Request'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
