"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ChevronDown, User, Send } from "lucide-react"

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

interface Request {
  id: string
  title: string
  description: string
  status: string
  priority: string
  client_id: string
  created_at: string
  updated_at: string
  due_date?: string
  client?: Client
  service_catalog_item?: ServiceCatalogItem
}

interface ActivityLogEntry {
  id: string
  request_id: string
  action: string
  description?: string
  entity_type?: string
  metadata?: Record<string, any>
  created_at: string
}

export default function RequestDetailPage() {
  const params = useParams()
  
  const [activeTab, setActiveTab] = useState("activity")
  const [message, setMessage] = useState("")
  const [request, setRequest] = useState<Request | null>(null)
  const [activities, setActivities] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadRequestData()
    }
  }, [params.id])

  const loadRequestData = async () => {
    try {
      setLoading(true)
      const requestId = params.id as string
      
      // For now, we'll create a mock request since we don't have the full API yet
      // Later we'll implement the proper API calls
      const mockRequest: Request = {
        id: requestId,
        title: "RR",
        description: "RR",
        status: "submitted",
        priority: "medium",
        client_id: "1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        client: {
          id: "1",
          name: "John Doe",
          email: "john@acmecorp.com",
          client_company: {
            name: "ACME Corp."
          }
        },
        service_catalog_item: {
          id: "1",
          title: "Our awesome marketing strategy",
          description: "Marketing services"
        }
      }
      
      const mockActivities: ActivityLogEntry[] = [
        {
          id: "1",
          request_id: requestId,
          action: "request_submitted",
          description: "Request was submitted",
          entity_type: "request",
          created_at: new Date().toISOString()
        }
      ]
      
      setRequest(mockRequest)
      setActivities(mockActivities)
    } catch (err) {
      console.error('Error loading request:', err)
      setError('Failed to load request details')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'text-blue-600'
      case 'in_progress': return 'text-yellow-600'
      case 'in_review': return 'text-purple-600'
      case 'completed': return 'text-green-600'
      case 'cancelled': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-400'
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !request) return

    setSendingMessage(true)
    try {
      // TODO: Implement API call to send message
      console.log('Sending message:', message)
      
      // For now, just add it to the activities list
      const newActivity: ActivityLogEntry = {
        id: Date.now().toString(),
        request_id: request.id,
        action: 'message_posted',
        description: message.trim(),
        entity_type: 'message',
        created_at: new Date().toISOString()
      }
      
      setActivities(prev => [newActivity, ...prev])
      setMessage("")
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setSendingMessage(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading request details...</div>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-600">{error || 'Request not found'}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Request Details</h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Request Title */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">{request.title}</h2>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 px-6">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab("activity")}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "activity"
                    ? "text-purple-600 border-purple-600"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                Activity
              </button>
              <button
                onClick={() => setActiveTab("details")}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "details"
                    ? "text-purple-600 border-purple-600"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("files")}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "files"
                    ? "text-purple-600 border-purple-600"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                Files
              </button>
              <button
                onClick={() => setActiveTab("checklists")}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "checklists"
                    ? "text-purple-600 border-purple-600"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                Checklists
              </button>
              <button
                onClick={() => setActiveTab("timesheets")}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "timesheets"
                    ? "text-purple-600 border-purple-600"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                Timesheets
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6">
            {activeTab === "activity" && (
              <div className="space-y-6">
                {/* Activity Items */}
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-900">
                            {activity.action === 'request_submitted' ? 'You submitted the Request' : 
                             activity.action === 'message_posted' ? 'You posted a message' :
                             activity.action}
                          </span>
                          <span className="text-sm text-gray-500">{formatDate(activity.created_at)}</span>
                        </div>
                        {activity.description && (
                          <div>
                            {activity.action === 'request_submitted' && (
                              <>
                                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                                <p className="text-gray-700">{request.description}</p>
                              </>
                            )}
                            {activity.action === 'message_posted' && (
                              <p className="text-gray-700">{activity.description}</p>
                            )}
                            {activity.action !== 'request_submitted' && activity.action !== 'message_posted' && (
                              <p className="text-gray-700">{activity.description}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Message Input */}
                <div className="border-t border-gray-200 pt-6">
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
                    </div>
                    <div className="flex">
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="flex-1 px-3 py-2 min-h-20 border-0 focus:outline-none focus:ring-0 resize-none text-gray-900"
                        placeholder="Type your message..."
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2M7 4h6M7 4H6a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2h-1" />
                        </svg>
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || sendingMessage}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={16} />
                      {sendingMessage ? 'Sending...' : ''}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs content (placeholder) */}
            {activeTab !== "activity" && (
              <div className="text-center py-12">
                <p className="text-gray-500">Content for {activeTab} tab will be displayed here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Summary</h3>
          
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-900 mb-1">{request.title}</div>
              <div className="text-sm text-gray-500">Created: {formatDate(request.created_at)}</div>
              <div className="text-sm text-gray-500">Service: {request.service_catalog_item?.title || 'No service selected'}</div>
            </div>

            <div className="flex items-center gap-3 py-3 border-t border-gray-200">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User size={16} className="text-gray-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{request.client?.name || 'Unknown Client'}</div>
                <div className="text-sm text-gray-500">{request.client?.client_company?.name || 'Individual'}</div>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <div className="relative">
                  <select className={`text-sm border-0 bg-transparent focus:ring-0 pr-6 capitalize ${getStatusColor(request.status)}`}>
                    <option>{request.status.replace('_', ' ')}</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-0 top-1 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Priority</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getPriorityColor(request.priority)}`}></div>
                  <span className="text-sm text-gray-500 capitalize">{request.priority}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Assigned To</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                  <span className="text-sm text-gray-500">None</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Due Date</span>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <span>{request.due_date ? formatDate(request.due_date) : 'Due Date'}</span>
                  <ChevronDown size={12} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Tags</span>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
