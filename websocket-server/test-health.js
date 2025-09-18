#!/usr/bin/env node

/**
 * Health check test for WebSocket server
 * Tests the HTTP health endpoint
 */

const http = require('http')

console.log('🏥 WebSocket Server Health Check')
console.log('================================\n')

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/health',
  method: 'GET'
}

console.log('📡 Testing health endpoint...')
console.log(`   URL: http://localhost:3001/health\n`)

const req = http.request(options, (res) => {
  console.log(`✅ Status: ${res.statusCode}`)
  console.log(`   Headers:`, res.headers)
  
  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })
  
  res.on('end', () => {
    try {
      const healthData = JSON.parse(data)
      console.log('\n📊 Health Data:')
      console.log(`   Status: ${healthData.status}`)
      console.log(`   Timestamp: ${healthData.timestamp}`)
      console.log(`   Connections: ${healthData.connections}`)
      
      if (healthData.status === 'healthy') {
        console.log('\n🎉 Server is healthy and ready!')
      } else {
        console.log('\n⚠️  Server health check failed')
      }
    } catch (error) {
      console.log('\n❌ Failed to parse health response:', error.message)
      console.log('Raw response:', data)
    }
  })
})

req.on('error', (error) => {
  console.log('❌ Health check failed:', error.message)
  console.log('\n💡 Make sure the WebSocket server is running:')
  console.log('   cd websocket-server')
  console.log('   npm install')
  console.log('   npm start\n')
})

req.end()
