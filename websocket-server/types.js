// WebSocket event type definitions
// This file contains the TypeScript-style interfaces for Socket.IO events

/**
 * Events emitted by the server to clients
 */
const ServerToClientEvents = {
  newMessage: (data) => {
    // data: {
    //   id: string
    //   request_id: string
    //   action: string
    //   description: string
    //   entity_type?: string
    //   metadata?: {
    //     user_id?: string
    //     user_name?: string
    //     user_role?: string
    //   }
    //   created_at: string
    // }
  },
  messageUpdated: (data) => {
    // data: {
    //   id: string
    //   request_id: string
    //   description: string
    // }
  },
  messageDeleted: (data) => {
    // data: {
    //   id: string
    //   request_id: string
    // }
  },
  requestUpdated: (data) => {
    // data: {
    //   id: string
    //   field: string
    //   value: string
    // }
  }
}

/**
 * Events emitted by clients to the server
 */
const ClientToServerEvents = {
  joinRequest: (data) => {
    // data: { requestId: string }
  },
  leaveRequest: (data) => {
    // data: { requestId: string }
  },
  sendMessage: (data) => {
    // data: {
    //   requestId: string
    //   action: string
    //   description: string
    //   entity_type?: string
    //   metadata?: {
    //     user_id?: string
    //     user_name?: string
    //     user_role?: string
    //   }
    // }
  },
  updateMessage: (data) => {
    // data: {
    //   requestId: string
    //   messageId: string
    //   description: string
    // }
  },
  deleteMessage: (data) => {
    // data: {
    //   requestId: string
    //   messageId: string
    // }
  }
}

/**
 * Inter-server events
 */
const InterServerEvents = {
  ping: () => {}
}

/**
 * Socket data attached to each connection
 */
const SocketData = {
  userId: undefined, // string | undefined
  userRole: undefined, // string | undefined
  userName: undefined // string | undefined
}

module.exports = {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData
}
