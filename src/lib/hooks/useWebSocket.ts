import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { ClientToServerEvents, ServerToClientEvents } from '@/lib/websocket'
import { getWebSocketUrl, WEBSOCKET_CONFIG } from '@/lib/config/websocket'

export interface WebSocketMessage {
  id: string
  request_id: string
  action: string
  description: string
  entity_type?: string
  metadata?: {
    user_id?: string
    user_name?: string
    user_role?: string
  }
  created_at: string
}

export interface WebSocketUpdate {
  id: string
  request_id: string
  description: string
}

export interface WebSocketDelete {
  id: string
  request_id: string
}

export interface WebSocketRequestUpdate {
  id: string
  field: string
  value: string
}

export const useWebSocket = (
  requestId?: string, 
  onNewMessage?: (message: WebSocketMessage) => void,
  onMessageUpdate?: (update: WebSocketUpdate) => void,
  onMessageDelete?: (deletion: WebSocketDelete) => void
) => {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<WebSocketMessage[]>([])
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)
  
  // Use refs to store the latest callback functions
  const onNewMessageRef = useRef(onNewMessage)
  const onMessageUpdateRef = useRef(onMessageUpdate)
  const onMessageDeleteRef = useRef(onMessageDelete)
  
  // Update refs when callbacks change
  useEffect(() => {
    onNewMessageRef.current = onNewMessage
  }, [onNewMessage])
  
  useEffect(() => {
    onMessageUpdateRef.current = onMessageUpdate
  }, [onMessageUpdate])
  
  useEffect(() => {
    onMessageDeleteRef.current = onMessageDelete
  }, [onMessageDelete])

  useEffect(() => {
    // Initialize socket connection
    const websocketUrl = getWebSocketUrl()
    
    const newSocket = io(websocketUrl, WEBSOCKET_CONFIG)

    socketRef.current = newSocket
    setSocket(newSocket)

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('WebSocket connected:', newSocket.id)
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
    })

    // Message event handlers
    newSocket.on('newMessage', (data: WebSocketMessage) => {
      console.log('New message received:', data)
      setMessages(prev => [...prev, data])
      if (onNewMessageRef.current) {
        onNewMessageRef.current(data)
      }
    })

    newSocket.on('messageUpdated', (data: WebSocketUpdate) => {
      console.log('Message updated:', data)
      setMessages(prev => 
        prev.map(msg => 
          msg.id === data.id 
            ? { ...msg, description: data.description }
            : msg
        )
      )
      if (onMessageUpdateRef.current) {
        onMessageUpdateRef.current(data)
      }
    })

    newSocket.on('messageDeleted', (data: WebSocketDelete) => {
      console.log('Message deleted:', data)
      setMessages(prev => prev.filter(msg => msg.id !== data.id))
      if (onMessageDeleteRef.current) {
        onMessageDeleteRef.current(data)
      }
    })

    newSocket.on('requestUpdated', (data: WebSocketRequestUpdate) => {
      console.log('Request updated:', data)
      // This could trigger a callback to update the request state
    })

    return () => {
      newSocket.close()
      socketRef.current = null
    }
  }, [])

  // Join request room when requestId is provided
  useEffect(() => {
    if (socket && requestId && isConnected) {
      socket.emit('joinRequest', { requestId })
      console.log(`Joined request room: ${requestId}`)

      return () => {
        socket.emit('leaveRequest', { requestId })
        console.log(`Left request room: ${requestId}`)
      }
    }
  }, [socket, requestId, isConnected])

  // Send message function
  const sendMessage = (data: {
    action: string
    description: string
    entity_type?: string
    metadata?: {
      user_id?: string
      user_name?: string
      user_role?: string
    }
  }) => {
    if (socket && requestId && isConnected) {
      socket.emit('sendMessage', {
        requestId,
        ...data
      })
    }
  }

  // Update message function
  const updateMessage = (messageId: string, description: string) => {
    if (socket && requestId && isConnected) {
      socket.emit('updateMessage', {
        requestId,
        messageId,
        description
      })
    }
  }

  // Delete message function
  const deleteMessage = (messageId: string) => {
    if (socket && requestId && isConnected) {
      socket.emit('deleteMessage', {
        requestId,
        messageId
      })
    }
  }

  return {
    socket,
    isConnected,
    messages,
    sendMessage,
    updateMessage,
    deleteMessage
  }
}
