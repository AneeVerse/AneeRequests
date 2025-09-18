/**
 * WebSocket configuration for the frontend
 * This file centralizes WebSocket URL configuration
 */

export const getWebSocketUrl = (): string => {
  // In production, use the Railway WebSocket server URL
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'https://your-railway-app.railway.app'
  }
  
  // In development, use local WebSocket server
  return 'http://localhost:3001'
}

export const WEBSOCKET_CONFIG = {
  path: '/api/socketio',
  transports: ['websocket', 'polling'],
  timeout: 20000,
  forceNew: true
}
