import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { Socket } from 'socket.io'

// Global Socket.IO instance
declare global {
  var io: SocketIOServer | undefined
}

// Helper function to broadcast to a specific request room
export const broadcastToRequest = (
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  requestId: string,
  event: keyof ServerToClientEvents,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
) => {
  if (io) {
    io.to(`request:${requestId}`).emit(event, data)
  }
}

export interface ServerToClientEvents {
  newMessage: (data: {
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
  }) => void
  messageUpdated: (data: {
    id: string
    request_id: string
    description: string
  }) => void
  messageDeleted: (data: {
    id: string
    request_id: string
  }) => void
  requestUpdated: (data: {
    id: string
    field: string
    value: string
  }) => void
}

export interface ClientToServerEvents {
  joinRequest: (data: { requestId: string }) => void
  leaveRequest: (data: { requestId: string }) => void
  sendMessage: (data: {
    requestId: string
    action: string
    description: string
    entity_type?: string
    metadata?: {
      user_id?: string
      user_name?: string
      user_role?: string
    }
  }) => void
  updateMessage: (data: {
    requestId: string
    messageId: string
    description: string
  }) => void
  deleteMessage: (data: {
    requestId: string
    messageId: string
  }) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  userId?: string
  userRole?: string
  userName?: string
}

export type SocketType = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>

// Store active connections by request ID
const requestRooms = new Map<string, Set<string>>()

export const initializeSocketIO = (server: NetServer) => {
  const io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(server, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_APP_URL 
        : 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  })

  io.on('connection', (socket: SocketType) => {
    console.log('New client connected:', socket.id)

    // Handle joining a request room
    socket.on('joinRequest', (data) => {
      const { requestId } = data
      socket.join(`request:${requestId}`)
      
      // Track the connection
      if (!requestRooms.has(requestId)) {
        requestRooms.set(requestId, new Set())
      }
      requestRooms.get(requestId)?.add(socket.id)
      
      console.log(`Socket ${socket.id} joined request ${requestId}`)
    })

    // Handle leaving a request room
    socket.on('leaveRequest', (data) => {
      const { requestId } = data
      socket.leave(`request:${requestId}`)
      
      // Remove from tracking
      const room = requestRooms.get(requestId)
      if (room) {
        room.delete(socket.id)
        if (room.size === 0) {
          requestRooms.delete(requestId)
        }
      }
      
      console.log(`Socket ${socket.id} left request ${requestId}`)
    })

    // Handle sending a message
    socket.on('sendMessage', async (data) => {
      const { requestId, action, description, entity_type, metadata } = data
      
      try {
        // Here you would typically save the message to the database
        // For now, we'll just broadcast it to the room
        const messageData = {
          id: `temp_${Date.now()}`,
          request_id: requestId,
          action,
          description,
          entity_type,
          metadata,
          created_at: new Date().toISOString()
        }

        // Broadcast to all clients in the request room
        io.to(`request:${requestId}`).emit('newMessage', messageData)
        
        console.log(`Message sent to request ${requestId}:`, messageData)
      } catch (error) {
        console.error('Error handling sendMessage:', error)
      }
    })

    // Handle updating a message
    socket.on('updateMessage', (data) => {
      const { requestId, messageId, description } = data
      
      const updateData = {
        id: messageId,
        request_id: requestId,
        description
      }

      // Broadcast to all clients in the request room
      io.to(`request:${requestId}`).emit('messageUpdated', updateData)
      
      console.log(`Message updated in request ${requestId}:`, updateData)
    })

    // Handle deleting a message
    socket.on('deleteMessage', (data) => {
      const { requestId, messageId } = data
      
      const deleteData = {
        id: messageId,
        request_id: requestId
      }

      // Broadcast to all clients in the request room
      io.to(`request:${requestId}`).emit('messageDeleted', deleteData)
      
      console.log(`Message deleted in request ${requestId}:`, deleteData)
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
      
      // Clean up from all rooms
      for (const [requestId, connections] of requestRooms.entries()) {
        if (connections.has(socket.id)) {
          connections.delete(socket.id)
          if (connections.size === 0) {
            requestRooms.delete(requestId)
          }
        }
      }
    })
  })

  return io
}
