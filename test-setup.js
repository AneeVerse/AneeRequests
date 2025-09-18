#!/usr/bin/env node

/**
 * Test script to verify the setup is working correctly
 */

const http = require('http')

console.log('🧪 Testing Complete Setup')
console.log('==========================\n')

// Test 1: Check if WebSocket server is running
function testWebSocketServer() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      method: 'GET',
      timeout: 5000
    }

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ WebSocket server is running on port 3001')
        resolve(true)
      } else {
        console.log('❌ WebSocket server health check failed')
        resolve(false)
      }
    })

    req.on('error', () => {
      console.log('❌ WebSocket server is not running')
      console.log('💡 Start it with: cd websocket-server && npm start')
      resolve(false)
    })

    req.on('timeout', () => {
      console.log('❌ WebSocket server is not responding')
      resolve(false)
    })

    req.end()
  })
}

// Test 2: Check if frontend server is running
function testFrontendServer() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET',
      timeout: 5000
    }

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Frontend server is running on port 3000')
        resolve(true)
      } else {
        console.log('❌ Frontend server is not responding properly')
        resolve(false)
      }
    })

    req.on('error', () => {
      console.log('❌ Frontend server is not running')
      console.log('💡 Start it with: npm run dev')
      resolve(false)
    })

    req.on('timeout', () => {
      console.log('❌ Frontend server is not responding')
      resolve(false)
    })

    req.end()
  })
}

async function runTests() {
  console.log('🔍 Running tests...\n')
  
  const wsRunning = await testWebSocketServer()
  const frontendRunning = await testFrontendServer()
  
  console.log('\n📋 Test Results:')
  console.log(`WebSocket Server: ${wsRunning ? '✅ Running' : '❌ Not running'}`)
  console.log(`Frontend Server: ${frontendRunning ? '✅ Running' : '❌ Not running'}`)
  
  if (wsRunning && frontendRunning) {
    console.log('\n🎉 Setup is working correctly!')
    console.log('\n📝 Next Steps:')
    console.log('1. Open http://localhost:3000 in your browser')
    console.log('2. Check browser console for WebSocket connection logs')
    console.log('3. Look for "WebSocket connected: [socket-id]" message')
    console.log('4. Test real-time features in your app')
  } else {
    console.log('\n⚠️  Some services are not running')
    console.log('\n🔧 To fix:')
    if (!wsRunning) {
      console.log('- Start WebSocket server: cd websocket-server && npm start')
    }
    if (!frontendRunning) {
      console.log('- Start frontend server: npm run dev')
    }
  }
}

runTests()
