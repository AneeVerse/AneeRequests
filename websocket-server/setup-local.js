#!/usr/bin/env node

/**
 * Local setup script for WebSocket server
 * Helps set up the local testing environment
 */

const fs = require('fs')
const path = require('path')

console.log('🚀 WebSocket Server Local Setup')
console.log('================================\n')

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: Please run this script from the websocket-server directory')
  process.exit(1)
}

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.log('📝 Creating .env file from template...')
  try {
    fs.copyFileSync('env.local', '.env')
    console.log('✅ .env file created')
  } catch (error) {
    console.log('⚠️  Could not create .env file automatically')
    console.log('💡 Please copy env.local to .env and update the values')
  }
} else {
  console.log('✅ .env file already exists')
}

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('📦 Installing dependencies...')
  console.log('   Run: npm install')
} else {
  console.log('✅ Dependencies already installed')
}

console.log('\n📋 Setup Complete!')
console.log('\n🔧 Next Steps:')
console.log('1. Update .env file with your MongoDB connection string')
console.log('2. Install dependencies: npm install')
console.log('3. Start the server: npm start')
console.log('4. Run tests: npm run test:all')
console.log('5. Open test-browser.html in your browser for manual testing')
console.log('\n📚 Documentation:')
console.log('- LOCAL_TESTING.md - Detailed testing guide')
console.log('- README.md - Server documentation')
console.log('- RAILWAY_DEPLOYMENT.md - Deployment guide')
console.log('\n🎉 Ready to test locally!')
