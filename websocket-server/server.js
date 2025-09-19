const { createServer } = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

const port = process.env.PORT || 3001

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aneerequests')
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

// Connect to MongoDB
connectDB()

// Create HTTP server
const httpServer = createServer()

// Initialize Socket.IO with CORS configuration
const io = new Server(httpServer, {
  path: '/api/socketio',
  addTrailingSlash: false,
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'https://app.aneeverse.com'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Store active connections by request ID
const requestRooms = new Map()

// Socket.IO event handlers
io.on('connection', (socket) => {
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

// HTTP API endpoints
httpServer.on('request', (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      connections: io.engine.clientsCount
    }))
  } else if (req.url === '/api/broadcast' && req.method === 'POST') {
    // Handle broadcast requests from main app
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        const data = JSON.parse(body)
        const { requestId, event, messageData } = data
        
        console.log(`Broadcasting ${event} to request ${requestId}:`, messageData)
        
        // Broadcast to the request room
        io.to(`request:${requestId}`).emit(event, messageData)
        
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true }))
      } catch (error) {
        console.error('Error handling broadcast:', error)
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid request' }))
      }
    })
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
  }
})

// Start server
httpServer.listen(port, () => {
  console.log(`WebSocket server running on port ${port}`)
  console.log(`Health check available at http://localhost:${port}/health`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  httpServer.close(() => {
    console.log('Process terminated')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  httpServer.close(() => {
    console.log('Process terminated')
    process.exit(0)
  })
})
