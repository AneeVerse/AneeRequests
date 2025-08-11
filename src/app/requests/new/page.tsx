"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"

interface Client {
  id: string
  name: string
  email?: string
  client_company?: {
    name: string
  }
}

interface ServiceCatalogItem {
  id: string
  title: string
  description: string
}

export default function CreateRequestPage() {
  const router = useRouter()
  
  const [step, setStep] = useState(1)
  const [selectedClient, setSelectedClient] = useState("")
  const [selectedService, setSelectedService] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showClientForm, setShowClientForm] = useState(false)
  const [newClientData, setNewClientData] = useState({
    name: "",
    email: "",
    client_company_name: ""
  })
  
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<ServiceCatalogItem[]>([])

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      const [clientsData, servicesData] = await Promise.all([
        fetch('/api/clients').then(res => res.json()),
        fetch('/api/service-catalog').then(res => res.json())
      ])
      setClients(clientsData)
      setServices(servicesData)
      
      // Set default service if available
      if (servicesData.length > 0) {
        setSelectedService(servicesData[0].id)
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data')
    }
  }

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
    if (!title || !description || !selectedClient) {
      setError('Please fill in all required fields')
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
          client_id: selectedClient,
          service_catalog_item_id: selectedService || undefined
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create request')
      }
      
      const newRequest = await response.json()
      router.push(`/requests/${newRequest.id}`)
    } catch (err) {
      console.error('Error creating request:', err)
      setError('Failed to create request. Please try again.')
      setLoading(false)
    }
  }

  const handleExit = () => {
    router.push("/requests")
  }

  return (
    <div className="min-h-screen bg-purple-600 flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? "bg-purple-300 text-purple-900" : "bg-purple-500 text-purple-200"
            }`}>
              {step >= 1 ? "✓" : "1"}
            </div>
            <div className={`w-16 h-0.5 ${step >= 2 ? "bg-purple-300" : "bg-purple-500"}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? "bg-purple-300 text-purple-900" : "bg-purple-500 text-purple-200 border-2 border-purple-400"
            }`}>
              2
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-2xl font-semibold text-gray-900 text-center mb-8">Create Request</h1>

          {/* Step 1: Client Selection */}
          {step === 1 && (
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 appearance-none bg-white text-gray-900"
                        >
                          <option value="">Select a client...</option>
                          {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.name} ({client.client_company?.name || 'Individual'})
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                      </div>
                      
                      {clients.length === 0 ? (
                        <div className="text-center py-4 bg-gray-50 rounded-md border-2 border-dashed border-gray-300">
                          <p className="text-sm text-gray-600 mb-2">No clients found</p>
                          <button
                            type="button"
                            onClick={() => setShowClientForm(true)}
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                          >
                            Create your first client
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowClientForm(true)}
                          className="w-full text-center py-2 text-sm text-purple-600 hover:text-purple-700 border border-purple-200 rounded-md hover:bg-purple-50"
                        >
                          + Add new client
                        </button>
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
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                        />
                      </div>
                      
                      <div>
                        <input
                          type="email"
                          placeholder="Email (optional)"
                          value={newClientData.email}
                          onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                        />
                      </div>
                      
                      <div>
                        <input
                          type="text"
                          placeholder="Company name (optional)"
                          value={newClientData.client_company_name}
                          onChange={(e) => setNewClientData(prev => ({ ...prev, client_company_name: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleCreateClient}
                        disabled={loading || !newClientData.name.trim()}
                        className="w-full px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Title and Description */}
          {step === 2 && (
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                    placeholder="Enter request title"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Description <span className="text-red-500">(Required)</span>
                  </label>
                  <div className="border border-gray-300 rounded-md">
                    {/* Rich Text Editor Toolbar */}
                    <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50">
                      <button className="p-1 text-gray-600 hover:bg-gray-200 rounded">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 8a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 12a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1z" />
                        </svg>
                      </button>
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
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 min-h-32 border-0 focus:outline-none focus:ring-0 resize-none text-gray-900"
                      placeholder="I am looking to create a display for my website..."
                    />
                  </div>
                </div>

                {/* Service Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Service</label>
                  <div className="relative">
                    <select 
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 appearance-none bg-white text-gray-900"
                    >
                      <option value="">Select a service...</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* File Upload Area */}
                <div className="mb-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">Drag files here or click to upload</p>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between pt-6">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  onClick={handleCreateRequest}
                  disabled={!title || !description || loading}
                  className="px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
