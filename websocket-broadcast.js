/**
 * WebSocket broadcasting utility for API routes
 * This allows API routes to send messages to the WebSocket server
 */

const axios = require('axios')

const WEBSOCKET_SERVER_URL = process.env.WEBSOCKET_SERVER_URL || 'http://localhost:3001'

class WebSocketBroadcaster {
  static async broadcastToRequest(requestId, event, data) {
    try {
      // For now, we'll just log the broadcast
      // In a real implementation, you'd send this to your WebSocket server
      console.log(`Broadcasting to request ${requestId}:`, { event, data })
      
      // TODO: Implement actual broadcasting to WebSocket server
      // This could be done via:
      // 1. HTTP API endpoint on WebSocket server
      // 2. Redis pub/sub
      // 3. Direct WebSocket connection
      
      return { success: true }
    } catch (error) {
      console.error('Error broadcasting to WebSocket:', error)
      return { success: false, error: error.message }
    }
  }

  static async broadcastNewMessage(requestId, messageData) {
    return this.broadcastToRequest(requestId, 'newMessage', messageData)
  }

  static async broadcastMessageUpdate(requestId, messageId, description) {
    return this.broadcastToRequest(requestId, 'messageUpdated', {
      id: messageId,
      request_id: requestId,
      description
    })
  }

  static async broadcastMessageDeletion(requestId, messageId) {
    return this.broadcastToRequest(requestId, 'messageDeleted', {
      id: messageId,
      request_id: requestId
    })
  }
}

module.exports = WebSocketBroadcaster
