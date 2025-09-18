# Local Testing Guide

This guide will help you test the WebSocket server locally before deploying to Railway.

## Prerequisites

1. **Node.js** (version 18 or higher)
2. **MongoDB** (local installation or MongoDB Atlas)
3. **Your main application** running on `http://localhost:3000`

## Step 1: Install Dependencies

```bash
cd websocket-server
npm install
```

## Step 2: Configure Environment

1. **Copy environment file**:
   ```bash
   cp env.local .env
   ```

2. **Update `.env` file** with your MongoDB connection:
   ```env
   MONGODB_URI=mongodb://localhost:27017/aneerequests
   # OR use MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aneerequests
   ```

## Step 3: Start the WebSocket Server

```bash
# Development mode (with auto-restart)
npm run dev

# OR production mode
npm start
```

You should see:
```
MongoDB connected successfully
WebSocket server running on port 3001
Health check available at http://localhost:3001/health
```

## Step 4: Test the Server

### Test 1: Health Check
```bash
node test-health.js
```

Expected output:
```
✅ Status: 200
📊 Health Data:
   Status: healthy
   Timestamp: 2024-01-01T12:00:00.000Z
   Connections: 0
🎉 Server is healthy and ready!
```

### Test 2: WebSocket Functionality
```bash
node test-local.js
```

Expected output:
```
✅ Connected to WebSocket server!
🧪 Running WebSocket tests...
📨 Received newMessage: {...}
✏️  Received messageUpdated: {...}
🗑️  Received messageDeleted: {...}
🎉 WebSocket server is working correctly!
```

## Step 5: Test with Frontend

### Update Frontend Environment

1. **Create/update `.env.local` in your main project**:
   ```env
   NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3001
   ```

2. **Start your main application**:
   ```bash
   # In your main project directory
   npm run dev
   ```

3. **Test the connection**:
   - Open `http://localhost:3000`
   - Navigate to a request page
   - Check browser console for WebSocket connection logs
   - Look for "WebSocket connected" message

## Step 6: Test Real-time Features

1. **Open two browser windows** to the same request page
2. **Send a message** in one window
3. **Verify** it appears in the other window instantly
4. **Test editing/deleting** messages

## Troubleshooting

### Common Issues

1. **"Connection refused" error**:
   - Make sure WebSocket server is running on port 3001
   - Check if port 3001 is available: `netstat -an | findstr 3001`

2. **MongoDB connection error**:
   - Verify MongoDB is running locally
   - Check your MongoDB connection string
   - Ensure database exists

3. **CORS errors**:
   - Verify `ALLOWED_ORIGINS` includes `http://localhost:3000`
   - Check browser console for CORS error details

4. **Frontend not connecting**:
   - Verify `NEXT_PUBLIC_WEBSOCKET_URL` is set correctly
   - Check browser Network tab for WebSocket connection attempts
   - Look for 404 errors on `/api/socketio` endpoint

### Debug Commands

```bash
# Check if port 3001 is in use
netstat -an | findstr 3001

# Check MongoDB connection
mongosh mongodb://localhost:27017/aneerequests

# Test WebSocket server directly
curl http://localhost:3001/health
```

### Logs

- **WebSocket server logs**: Check terminal where you ran `npm start`
- **Frontend logs**: Check browser console
- **Network logs**: Check browser Network tab

## Testing Checklist

- [ ] WebSocket server starts without errors
- [ ] Health check endpoint returns 200
- [ ] WebSocket test script runs successfully
- [ ] Frontend connects to WebSocket server
- [ ] Real-time messaging works between browser windows
- [ ] Message editing/deletion works
- [ ] No CORS errors in browser console
- [ ] MongoDB connection is stable

## Next Steps

Once local testing is successful:

1. **Deploy to Railway** (see `RAILWAY_DEPLOYMENT.md`)
2. **Update Vercel environment** with Railway URL
3. **Test production deployment**

## Support

If you encounter issues:
1. Check the logs in both terminals
2. Verify all environment variables are set correctly
3. Ensure MongoDB is accessible
4. Test with the provided test scripts
