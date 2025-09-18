const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

// Create Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  // Create HTTP server
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  // Initialize Socket.IO
  const io = new Server(httpServer, {
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

  // Store active connections by request ID
  const requestRooms = new Map()

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

  // Store io instance globally for API routes
  global.io = io

  httpServer.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
