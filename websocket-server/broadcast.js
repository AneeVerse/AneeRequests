const axios = require('axios')

/**
 * Utility functions for broadcasting messages to the WebSocket server
 * This can be used by the main Vercel application to send messages
 */

class WebSocketBroadcaster {
  constructor(websocketServerUrl) {
    this.serverUrl = websocketServerUrl
  }

  /**
   * Broadcast a new message to a request room
   * @param {string} requestId - The request ID
   * @param {Object} messageData - The message data
   */
  async broadcastNewMessage(requestId, messageData) {
    try {
      // This would typically be done via a direct WebSocket connection
      // or an API endpoint on the WebSocket server
      console.log(`Broadcasting new message to request ${requestId}:`, messageData)
      
      // For now, we'll just log it. In a real implementation,
      // you might want to use a Redis pub/sub or direct WebSocket connection
      return { success: true }
    } catch (error) {
      console.error('Error broadcasting new message:', error)
      throw error
    }
  }

  /**
   * Broadcast a message update to a request room
   * @param {string} requestId - The request ID
   * @param {string} messageId - The message ID
   * @param {string} description - The updated description
   */
  async broadcastMessageUpdate(requestId, messageId, description) {
    try {
      console.log(`Broadcasting message update to request ${requestId}:`, { messageId, description })
      return { success: true }
    } catch (error) {
      console.error('Error broadcasting message update:', error)
      throw error
    }
  }

  /**
   * Broadcast a message deletion to a request room
   * @param {string} requestId - The request ID
   * @param {string} messageId - The message ID
   */
  async broadcastMessageDeletion(requestId, messageId) {
    try {
      console.log(`Broadcasting message deletion to request ${requestId}:`, { messageId })
      return { success: true }
    } catch (error) {
      console.error('Error broadcasting message deletion:', error)
      throw error
    }
  }

  /**
   * Broadcast a request update to a request room
   * @param {string} requestId - The request ID
   * @param {string} field - The field that was updated
   * @param {string} value - The new value
   */
  async broadcastRequestUpdate(requestId, field, value) {
    try {
      console.log(`Broadcasting request update to request ${requestId}:`, { field, value })
      return { success: true }
    } catch (error) {
      console.error('Error broadcasting request update:', error)
      throw error
    }
  }
}

module.exports = WebSocketBroadcaster
