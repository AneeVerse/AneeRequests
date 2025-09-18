# 🧪 Quick Local Testing Guide

## **Step 1: Start the WebSocket Server**

```bash
cd websocket-server
npm start
```

You should see:
```
MongoDB connected successfully
WebSocket server running on port 3001
Health check available at http://localhost:3001/health
```

## **Step 2: Test the Server (Choose one method)**

### Method A: Automated Tests
```bash
# In a new terminal (keep server running)
cd websocket-server
npm run test:all
```

### Method B: Browser Testing
1. Open `websocket-server/test-browser.html` in your browser
2. Click "Connect" button
3. Enter a request ID (e.g., "test-123")
4. Click "Join Room"
5. Send messages and test functionality

### Method C: Health Check Only
```bash
cd websocket-server
npm run test:health
```

## **Step 3: Test with Your Frontend**

1. **Update your main project's `.env.local`**:
   ```env
   NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3001
   ```

2. **Start your main application**:
   ```bash
   # In your main project directory
   npm run dev
   ```

3. **Test real-time features**:
   - Open two browser windows to the same request page
   - Send messages in one window
   - Verify they appear instantly in the other window

## **Step 4: Verify Everything Works**

✅ **WebSocket server starts without errors**  
✅ **Health check returns 200 status**  
✅ **Browser test shows "Connected" status**  
✅ **Frontend connects to WebSocket server**  
✅ **Real-time messaging works between windows**  
✅ **No CORS errors in browser console**  

## **Troubleshooting**

### If WebSocket server won't start:
- Check if port 3001 is available: `netstat -an | findstr 3001`
- Verify MongoDB is running
- Check `.env` file has correct MongoDB URI

### If frontend won't connect:
- Verify `NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3001`
- Check browser console for errors
- Ensure WebSocket server is running

### If you see CORS errors:
- Verify `ALLOWED_ORIGINS` in `.env` includes `http://localhost:3000`
- Restart the WebSocket server after changing `.env`

## **Test Commands Summary**

```bash
# Start server
npm start

# Test health
npm run test:health

# Test WebSocket functionality
npm run test

# Run all tests
npm run test:all

# Browser test
# Open test-browser.html in browser
```

## **Next Steps After Local Testing**

Once everything works locally:

1. **Deploy to Railway** (see `websocket-server/RAILWAY_DEPLOYMENT.md`)
2. **Update Vercel environment** with Railway URL
3. **Test production deployment**

---

**🎉 You're ready to test locally!** Start with `npm start` in the websocket-server directory.
