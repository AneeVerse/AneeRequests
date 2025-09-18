# WebSocket Live Chat Implementation

This document describes the WebSocket implementation for live chat communication in the request system.

## Features Added

1. **Real-time Messaging**: Messages are sent and received instantly via WebSocket connections
2. **Live Status Indicator**: Shows connection status (Live/Offline) in the UI
3. **Automatic Reconnection**: WebSocket automatically reconnects on connection loss
4. **Room-based Communication**: Each request has its own WebSocket room for isolated communication

## Architecture

### Server Side
- **Custom Server**: `server.js` - Custom Node.js server that handles both Next.js and Socket.IO
- **WebSocket Library**: `src/lib/websocket.ts` - Socket.IO server configuration and event handlers
- **API Integration**: Updated API routes to broadcast WebSocket events when data changes

### Client Side
- **WebSocket Hook**: `src/lib/hooks/useWebSocket.ts` - React hook for WebSocket functionality
- **Status Component**: `src/components/WebSocketStatus.tsx` - UI component showing connection status
- **Request Page**: Updated `src/app/requests/[id]/page.tsx` to use WebSocket for live chat

## Setup Instructions

1. **Install Dependencies** (already done):
   ```bash
   npm install ws @types/ws socket.io socket.io-client
   ```

2. **Environment Variables**:
   Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Start the Server**:
   ```bash
   npm run dev
   ```

## How It Works

### Message Flow
1. User types a message and clicks send
2. Message is sent via WebSocket for instant delivery
3. Message is also saved to database via API
4. All connected clients in the request room receive the message instantly
5. UI updates automatically with the new message

### WebSocket Events
- `joinRequest`: Client joins a request room
- `leaveRequest`: Client leaves a request room
- `sendMessage`: Send a new message
- `updateMessage`: Update an existing message
- `deleteMessage`: Delete a message
- `newMessage`: Broadcast new message to room
- `messageUpdated`: Broadcast message update to room
- `messageDeleted`: Broadcast message deletion to room

### Room Management
- Each request has its own WebSocket room: `request:${requestId}`
- Clients automatically join/leave rooms when navigating to/from request pages
- Messages are only broadcast to clients in the same request room

## Testing

1. Open the application in multiple browser tabs/windows
2. Navigate to the same request in both tabs
3. Send a message from one tab
4. The message should appear instantly in the other tab
5. Check the status indicator shows "Live Chat" when connected

## Troubleshooting

- If WebSocket connection fails, check browser console for errors
- Ensure the custom server is running (`npm run dev`)
- Check that all dependencies are installed
- Verify environment variables are set correctly

## Future Enhancements

- Typing indicators
- Message read receipts
- File uploads via WebSocket
- Push notifications for new messages
- Message encryption
- Message history synchronization
