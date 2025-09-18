// WebSocket type definitions for frontend use
// Server-side WebSocket code has been moved to the standalone websocket-server

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

// Note: Server-side WebSocket implementation has been moved to websocket-server/
// This file now only contains type definitions for frontend use
