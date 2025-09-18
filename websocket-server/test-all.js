#!/usr/bin/env node

/**
 * Comprehensive testing script for WebSocket server
 * Runs all tests in sequence
 */

const { spawn } = require('child_process')
const path = require('path')

console.log('🧪 Comprehensive WebSocket Server Testing')
console.log('==========================================\n')

async function runTest(testName, command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔍 Running ${testName}...`)
    console.log(`   Command: ${command} ${args.join(' ')}\n`)
    
    const child = spawn(command, args, {
      cwd: __dirname,
      stdio: 'inherit'
    })
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${testName} passed\n`)
        resolve()
      } else {
        console.log(`❌ ${testName} failed with code ${code}\n`)
        reject(new Error(`${testName} failed`))
      }
    })
    
    child.on('error', (error) => {
      console.log(`❌ ${testName} error:`, error.message)
      reject(error)
    })
  })
}

async function runAllTests() {
  try {
    console.log('📋 Test Plan:')
    console.log('1. Health check test')
    console.log('2. WebSocket functionality test')
    console.log('3. Browser test (manual)')
    console.log('4. Frontend integration test (manual)\n')
    
    // Test 1: Health check
    await runTest('Health Check', 'node', ['test-health.js'])
    
    // Test 2: WebSocket functionality
    await runTest('WebSocket Functionality', 'node', ['test-local.js'])
    
    console.log('🎉 All automated tests passed!')
    console.log('\n📝 Manual Tests:')
    console.log('1. Open test-browser.html in your browser')
    console.log('2. Test the WebSocket connection and messaging')
    console.log('3. Test with your frontend application')
    console.log('\n💡 Next Steps:')
    console.log('1. Start your main application: npm run dev (in main project)')
    console.log('2. Set NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3001')
    console.log('3. Test real-time features in your app')
    console.log('4. Deploy to Railway when ready')
    
  } catch (error) {
    console.error('\n❌ Testing failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Make sure WebSocket server is running: npm start')
    console.log('2. Check MongoDB connection')
    console.log('3. Verify port 3001 is available')
    console.log('4. Check environment variables')
    process.exit(1)
  }
}

// Check if server is running
const http = require('http')
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/health',
  method: 'GET',
  timeout: 5000
}

console.log('🔍 Checking if WebSocket server is running...')

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('✅ WebSocket server is running\n')
    runAllTests()
  } else {
    console.log('❌ WebSocket server is not responding properly')
    console.log('💡 Please start the server first: npm start')
    process.exit(1)
  }
})

req.on('error', (error) => {
  console.log('❌ WebSocket server is not running')
  console.log('💡 Please start the server first:')
  console.log('   cd websocket-server')
  console.log('   npm install')
  console.log('   npm start')
  process.exit(1)
})

req.on('timeout', () => {
  console.log('❌ WebSocket server is not responding')
  console.log('💡 Please start the server first: npm start')
  process.exit(1)
})

req.end()
