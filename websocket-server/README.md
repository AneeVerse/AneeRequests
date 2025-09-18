# AneeRequests WebSocket Server

This is the standalone WebSocket server for the AneeRequests application, designed to be deployed on Railway while the frontend remains on Vercel.

## Architecture

- **Frontend**: Deployed on Vercel
- **WebSocket Server**: Deployed on Railway
- **Communication**: Vercel API → Railway WebSocket → All clients

## Features

- Real-time messaging for request discussions
- Room-based communication (one room per request)
- Message broadcasting, updating, and deletion
- Connection management and cleanup
- Health check endpoint

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your actual values:
   - `MONGODB_URI`: Your MongoDB connection string
   - `ALLOWED_ORIGINS`: Comma-separated list of allowed frontend URLs
   - `FRONTEND_URL`: Your Vercel app URL

3. **Run the server**:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `production` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/aneerequests` |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `http://localhost:3000` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## API Endpoints

### Health Check
- **GET** `/health` - Returns server health status

## WebSocket Events

### Client to Server Events

- `joinRequest` - Join a request room
- `leaveRequest` - Leave a request room
- `sendMessage` - Send a new message
- `updateMessage` - Update an existing message
- `deleteMessage` - Delete a message

### Server to Client Events

- `newMessage` - New message received
- `messageUpdated` - Message was updated
- `messageDeleted` - Message was deleted
- `requestUpdated` - Request was updated

## Deployment on Railway

1. Connect your GitHub repository to Railway
2. Set the root directory to `websocket-server`
3. Configure environment variables in Railway dashboard
4. Deploy!

## Frontend Integration

Update your frontend WebSocket connection URL to point to your Railway deployment:

```javascript
const socket = io('https://your-railway-app.railway.app', {
  path: '/api/socketio',
  transports: ['websocket', 'polling']
})
```

## Development

The server uses nodemon for development with hot reloading:

```bash
npm run dev
```

## Monitoring

- Health check: `GET /health`
- Server logs show connection/disconnection events
- Room management is logged for debugging
