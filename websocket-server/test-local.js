#!/usr/bin/env node

/**
 * Local testing script for WebSocket server
 * This script helps test the WebSocket server locally before deployment
 */

const { io } = require('socket.io-client')

console.log('🧪 WebSocket Server Local Testing')
console.log('==================================\n')

// Test configuration
const WEBSOCKET_URL = 'http://localhost:3001'
const TEST_REQUEST_ID = 'test-request-123'

console.log('📡 Connecting to WebSocket server...')
console.log(`   URL: ${WEBSOCKET_URL}`)
console.log(`   Path: /api/socketio\n`)

// Create socket connection
const socket = io(WEBSOCKET_URL, {
  path: '/api/socketio',
  transports: ['websocket', 'polling']
})

// Test data
const testMessage = {
  requestId: TEST_REQUEST_ID,
  action: 'message_posted',
  description: 'This is a test message from the local testing script',
  entity_type: 'message',
  metadata: {
    user_id: 'test-user-123',
    user_name: 'Test User',
    user_role: 'admin'
  }
}

// Event handlers
socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server!')
  console.log(`   Socket ID: ${socket.id}\n`)
  
  // Start testing sequence
  runTests()
})

socket.on('disconnect', () => {
  console.log('❌ Disconnected from WebSocket server')
})

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message)
  console.log('\n💡 Make sure the WebSocket server is running:')
  console.log('   cd websocket-server')
  console.log('   npm install')
  console.log('   npm start\n')
  process.exit(1)
})

// Test event handlers
socket.on('newMessage', (data) => {
  console.log('📨 Received newMessage:', JSON.stringify(data, null, 2))
})

socket.on('messageUpdated', (data) => {
  console.log('✏️  Received messageUpdated:', JSON.stringify(data, null, 2))
})

socket.on('messageDeleted', (data) => {
  console.log('🗑️  Received messageDeleted:', JSON.stringify(data, null, 2))
})

socket.on('requestUpdated', (data) => {
  console.log('🔄 Received requestUpdated:', JSON.stringify(data, null, 2))
})

// Test functions
async function runTests() {
  console.log('🧪 Running WebSocket tests...\n')
  
  try {
    // Test 1: Join request room
    console.log('Test 1: Joining request room...')
    socket.emit('joinRequest', { requestId: TEST_REQUEST_ID })
    await sleep(1000)
    
    // Test 2: Send message
    console.log('Test 2: Sending message...')
    socket.emit('sendMessage', testMessage)
    await sleep(1000)
    
    // Test 3: Update message
    console.log('Test 3: Updating message...')
    socket.emit('updateMessage', {
      requestId: TEST_REQUEST_ID,
      messageId: 'test-message-123',
      description: 'This message has been updated!'
    })
    await sleep(1000)
    
    // Test 4: Delete message
    console.log('Test 4: Deleting message...')
    socket.emit('deleteMessage', {
      requestId: TEST_REQUEST_ID,
      messageId: 'test-message-123'
    })
    await sleep(1000)
    
    // Test 5: Leave request room
    console.log('Test 5: Leaving request room...')
    socket.emit('leaveRequest', { requestId: TEST_REQUEST_ID })
    await sleep(1000)
    
    console.log('\n✅ All tests completed!')
    console.log('🎉 WebSocket server is working correctly!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    console.log('\n🔌 Disconnecting...')
    socket.disconnect()
    process.exit(0)
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n🛑 Test interrupted by user')
  socket.disconnect()
  process.exit(0)
})

// Timeout after 30 seconds
setTimeout(() => {
  console.log('\n⏰ Test timeout - server may not be running')
  socket.disconnect()
  process.exit(1)
}, 30000)
