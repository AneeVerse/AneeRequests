"use client"
import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { ChevronDown, User, FileText, Trash2, Edit2 } from "lucide-react"
import { useAuth } from "@/lib/contexts/AuthContext"
import SimpleTextEditor from "@/components/SimpleTextEditor"

interface Client {
  id: string
  name: string
  email?: string
  client_company?: {
    name: string
  }
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
}

interface ActivityLogEntry {
  id: string
  request_id: string
  action: string
  description?: string
  entity_type?: string
  metadata?: {
    user_name?: string
    user_role?: string
    user_id?: string
  }
  created_at: string
  user_id?: string
  user_name?: string
  user_role?: string
}

export default function RequestDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [activeTab, setActiveTab] = useState("activity")
  const [request, setRequest] = useState<Request | null>(null)
  const [activities, setActivities] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deletingMessage, setDeletingMessage] = useState<string | null>(null)
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
      }
    }, 100)
  }

  useEffect(() => {
    if (activities.length > 0) {
      scrollToBottom()
    }
  }, [activities])

  useEffect(() => {
    const loadRequestData = async () => {
      try {
        setLoading(true)
        const requestId = params.id as string
        
        // Load request details
        const requestResponse = await fetch(`/api/requests/${requestId}`)
        if (!requestResponse.ok) {
          throw new Error('Failed to load request')
        }
        const requestData = await requestResponse.json()
        setRequest(requestData)

        // Load activity log
        const activityResponse = await fetch(`/api/requests/${requestId}/activity`)
        if (!activityResponse.ok) {
          throw new Error('Failed to load activity')
        }
        const activityData = await activityResponse.json()
        setActivities(activityData)
        
        // Scroll to bottom after loading activities
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
          }
        }, 200)
      } catch (err) {
        console.error('Error loading request:', err)
        setError('Failed to load request details')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      void loadRequestData()
    }
  }, [params.id])

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

  // Function to render markdown content with images
  const renderMarkdownContent = (content: string) => {
    if (!content) return ''
    
    // If content contains HTML tags, parse them properly
    if (content.includes('<')) {
      // Handle common HTML tags
      let html = content
      
      // Convert <p> tags to proper spacing
      html = html.replace(/<p>/g, '')
      html = html.replace(/<\/p>/g, '<br>')
      
      // Handle bold text: <strong>text</strong> -> <strong>text</strong>
      // Handle italic text: <em>text</em> -> <em>text</em>
      // Handle underline text: <u>text</u> -> <u>text</u>
      
      // Handle links: <a href="url">text</a> -> <a href="url">text</a>
      
      // Handle bullet lists: <li>item</li> -> <li>item</li>
      
      // Handle numbered lists: <li>item</li> -> <li>item</li>
      
      return html
    }
    
    // Convert markdown to HTML (for backward compatibility)
    let html = content
    
    // Handle bold text: **text** -> <strong>text</strong>
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Handle italic text: *text* -> <em>text</em>
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Handle underline text: __text__ -> <u>text</u>
    html = html.replace(/__(.*?)__/g, '<u>$1</u>')
    
    // Handle images: ![alt](src) -> <img alt="alt" src="src" />
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" class="max-w-full h-auto rounded-lg shadow-sm my-2" />')
    
    // Handle links: [text](url) -> <a href="url">text</a>
    html = html.replace(/\[([^\]]*)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
    
    // Handle bullet lists: • item -> <li>item</li>
    html = html.replace(/^•\s+(.+)$/gm, '<li>$1</li>')
    
    // Handle numbered lists: 1. item -> <li>item</li>
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    
    // Convert line breaks to <br> tags
    html = html.replace(/\n/g, '<br>')
    
    return html
  }

  const handleFieldUpdate = async (field: string, value: string) => {
    if (!request) return

    try {
      const response = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [field]: value
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update ${field}`)
      }

      const updatedRequest = await response.json()
      setRequest(updatedRequest)

      // Log the activity
      const activityResponse = await fetch(`/api/requests/${request.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'field_updated',
          description: `${field.replace('_', ' ')} updated to ${value}`,
          entity_type: 'field_update',
          metadata: {
            user_id: user?.id,
            user_name: user?.name,
            user_role: user?.role,
            field,
            old_value: request[field as keyof Request],
            new_value: value
          }
        }),
      })

      if (activityResponse.ok) {
        const newActivity = await activityResponse.json()
        setActivities(prev => [...prev, newActivity])
      }
    } catch (err) {
      console.error(`Error updating ${field}:`, err)
      setError(`Failed to update ${field}`)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !request) return

    setSendingMessage(true)
    try {
      const response = await fetch(`/api/requests/${request.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'message_posted',
          description: content.trim(),
          entity_type: 'message',
          metadata: {
            user_id: user?.id,
            user_name: user?.name,
            user_role: user?.role
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const newActivity = await response.json()
      setActivities(prev => [...prev, newActivity]) // Add to end instead of beginning
      
      // Scroll to bottom after adding new message
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
      }, 150)
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleDeleteMessage = async (activityId: string) => {
    if (!request) return
    
    setDeletingMessage(activityId)
    try {
      const response = await fetch(`/api/requests/${request.id}/activity/${activityId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete message')
      }
      
      // Remove the message from the local state
      setActivities(prev => prev.filter(activity => activity.id !== activityId))
    } catch (err) {
      console.error('Error deleting message:', err)
      setError('Failed to delete message')
    } finally {
      setDeletingMessage(null)
    }
  }

  const handleEditMessage = async (activityId: string) => {
    if (!request) return
    
    try {
      // Convert plain text to HTML format for consistency with rich text editor
      const htmlContent = `<p>${editContent.trim()}</p>`
      
      const response = await fetch(`/api/requests/${request.id}/activity/${activityId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: htmlContent
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update message')
      }
      
      const updatedActivity = await response.json()
      
      // Update the message in the local state
      setActivities(prev => prev.map(activity => 
        activity.id === activityId 
          ? { ...activity, description: updatedActivity.description }
          : activity
      ))
      
      // Reset edit state
      setEditingMessage(null)
      setEditContent("")
    } catch (err) {
      console.error('Error updating message:', err)
      setError('Failed to update message')
    }
  }

  const startEditingMessage = (activity: ActivityLogEntry) => {
    setEditingMessage(activity.id)
    // Convert HTML content to plain text for editing
    const plainText = activity.description ? 
      activity.description.replace(/<[^>]*>/g, '') : ""
    setEditContent(plainText)
  }

  const cancelEditingMessage = () => {
    setEditingMessage(null)
    setEditContent("")
  }

  const handleDeleteRequest = async () => {
    if (!request) return
    
    setDeleting(true)
    try {
      const response = await fetch(`/api/requests/${request.id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete request')
      }
      
      // Redirect to requests list
      window.location.href = '/requests'
    } catch (err) {
      console.error('Error deleting request:', err)
      setError('Failed to delete request')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const isAdmin = user?.role === 'admin'
  const isClient = user?.role === 'client'
  
  // Check if user can send messages
  // Allow all authenticated users to send messages for now
  // This can be restricted later if needed
  const canSendMessage = !!user // Any authenticated user can send messages
  
  // Alternative logic if you want to restrict based on ownership:
  // const canSendMessage = isAdmin || (
  //   isClient && (
  //     request?.client_id === user?.id ||
  //     user?.id?.startsWith('impersonated-') // Allow impersonated users
  //   )
  // )

  // Check if user can delete a specific message
  const canDeleteMessage = (activity: ActivityLogEntry) => {
    if (isAdmin) return true
    if (activity.action !== 'message_posted') return false
    return activity.metadata?.user_id === user?.id
  }

  // Check if user can edit a specific message
  const canEditMessage = (activity: ActivityLogEntry) => {
    if (isAdmin) return true
    if (activity.action !== 'message_posted') return false
    return activity.metadata?.user_id === user?.id
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
      <div className="flex-1 flex lg:flex-row flex-col">
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Request Title */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">{request.title}</h2>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 px-6">
            <div className="flex gap-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab("activity")}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "activity"
                    ? "text-purple-600 border-purple-600"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                Activity
              </button>
              <button
                onClick={() => setActiveTab("details")}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "details"
                    ? "text-purple-600 border-purple-600"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("files")}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "files"
                    ? "text-purple-600 border-purple-600"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                Files
              </button>
              <button
                onClick={() => setActiveTab("checklists")}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "checklists"
                    ? "text-purple-600 border-purple-600"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                Checklists
              </button>
              <button
                onClick={() => setActiveTab("timesheets")}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTab === "activity" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" style={{ maxHeight: 'calc(100vh - 500px)', minHeight: '300px' }}>
                  <div className="space-y-6">
                    {/* Activity Items */}
                    {activities.map((activity) => (
                      <div key={activity.id} className="group">
                        {activity.action === 'request_submitted' ? (
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <FileText size={16} className="text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">Request submitted</span>
                                    <span className="text-sm text-gray-500">{formatDate(activity.created_at)}</span>
                                  </div>
                                </div>
                                {activity.description && (
                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                                    <div
                                      className="text-gray-700 prose prose-sm max-w-none"
                                      dangerouslySetInnerHTML={{ __html: request.description || '' }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : activity.action === 'message_posted' ? (
                          <div className="flex items-start gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              activity.metadata?.user_role === 'admin' 
                                ? 'bg-purple-600' 
                                : 'bg-blue-600'
                            }`}>
                              <span className="text-white text-sm font-medium">
                                {activity.metadata?.user_role === 'admin' ? 'A' : 'C'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">
                                    {activity.metadata?.user_name || (activity.metadata?.user_role === 'admin' ? 'Admin' : 'Client')}
                                  </span>
                                  <span className="text-sm text-gray-500">{formatDate(activity.created_at)}</span>
                                </div>
                                {canDeleteMessage(activity) && (
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {canEditMessage(activity) && (
                                      <button
                                        onClick={() => startEditingMessage(activity)}
                                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                        title="Edit message"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteMessage(activity.id)}
                                      disabled={deletingMessage === activity.id}
                                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                      title="Delete message"
                                    >
                                      {deletingMessage === activity.id ? (
                                        <div className="w-4 h-4 animate-spin border-2 border-red-600 border-t-transparent rounded-full"></div>
                                      ) : (
                                        <Trash2 size={14} />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                {editingMessage === activity.id ? (
                                  <div className="space-y-3">
                                    <textarea
                                      value={editContent}
                                      onChange={(e) => setEditContent(e.target.value)}
                                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-black"
                                      rows={3}
                                      placeholder="Edit your message..."
                                    />
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleEditMessage(activity.id)}
                                        className="px-3 py-1.5 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={cancelEditingMessage}
                                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div 
                                    className="text-gray-700 prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: renderMarkdownContent(activity.description || '') }}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                            </div>
                            <div className="flex-1">
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-gray-900">{activity.action}</span>
                                  <span className="text-sm text-gray-500">{formatDate(activity.created_at)}</span>
                                </div>
                                {activity.description && (
                                  <p className="text-gray-700">{activity.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Message Input - Fixed Position */}
                <div className="border-t border-gray-200 p-4 bg-white">
                  <SimpleTextEditor
                    onSend={handleSendMessage}
                    placeholder={canSendMessage ? "Type your message..." : "You cannot send messages to this request"}
                    disabled={!canSendMessage}
                    sending={sendingMessage}
                  />
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

        {/* Sidebar - Always visible for both admin and client */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 p-6 bg-gray-50 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Summary</h3>
          
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-900 mb-1">{request.title}</div>
              <div className="text-sm text-gray-500">Created: {formatDate(request.created_at)}</div>
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
                  <select 
                    value={request.status}
                    onChange={(e) => handleFieldUpdate('status', e.target.value)}
                    className={`text-sm border-0 bg-transparent focus:ring-0 pr-6 capitalize cursor-pointer ${getStatusColor(request.status)}`}
                  >
                    <option value="submitted">Submitted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-0 top-1 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Priority</span>
                <div className="relative">
                  <select 
                    value={request.priority}
                    onChange={(e) => handleFieldUpdate('priority', e.target.value)}
                    className="text-sm border-0 bg-transparent focus:ring-0 pr-6 capitalize cursor-pointer text-gray-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-0 top-1 text-gray-400 pointer-events-none" />
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
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={request.due_date ? new Date(request.due_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleFieldUpdate('due_date', e.target.value)}
                    className="text-sm border-0 bg-transparent focus:ring-0 cursor-pointer text-gray-500"
                  />
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

              {/* Delete Request Option - Only for admins */}
              {isAdmin && (
                <div className="pt-3 border-t border-gray-200">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Request</h3>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this request? This action cannot be undone and will permanently remove the request and all associated messages.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800">Warning</p>
                    <p className="text-sm text-red-700 mt-1">This will delete the request &quot;{request?.title}&quot; and all its activity history.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRequest}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </div>
                ) : (
                  'Delete Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
