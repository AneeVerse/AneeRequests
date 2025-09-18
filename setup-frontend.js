#!/usr/bin/env node

/**
 * Frontend setup script to connect to standalone WebSocket server
 */

const fs = require('fs')

console.log('🔧 Frontend WebSocket Setup')
console.log('============================\n')

// Create .env.local file
const envContent = `# Frontend environment variables for local development
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3001
`

try {
  fs.writeFileSync('.env.local', envContent)
  console.log('✅ Created .env.local with WebSocket URL')
} catch (error) {
  console.log('⚠️  Could not create .env.local file')
  console.log('💡 Please create .env.local manually with:')
  console.log('   NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3001')
}

console.log('\n📋 Next Steps:')
console.log('1. Stop your current frontend server (Ctrl+C)')
console.log('2. Start WebSocket server: cd websocket-server && npm start')
console.log('3. Start frontend with new server: node server-nextjs.js')
console.log('4. Check browser console for WebSocket connection logs')
console.log('\n🔍 What to look for:')
console.log('- Browser console: "WebSocket connected: [socket-id]"')
console.log('- WebSocket server: "New client connected: [socket-id]"')
console.log('- App UI: Green "Live Chat" status indicator')
console.log('\n🎉 Ready to test!')
