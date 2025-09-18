# Railway Deployment Guide

This guide will help you deploy the WebSocket server to Railway.

## Prerequisites

1. A Railway account (sign up at [railway.app](https://railway.app))
2. Your MongoDB connection string
3. Your Vercel app URL

## Step 1: Prepare Your Repository

1. Make sure the `websocket-server` folder is in your repository root
2. Commit all changes to your repository

## Step 2: Deploy to Railway

1. **Connect Repository**:
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure Project**:
   - Set the **Root Directory** to `websocket-server`
   - Railway will automatically detect it's a Node.js project

3. **Set Environment Variables**:
   - Go to the "Variables" tab in your Railway project
   - Add the following variables:

   ```
   PORT=3001
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection_string
   ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

4. **Deploy**:
   - Railway will automatically build and deploy your project
   - Wait for the deployment to complete
   - Note down your Railway app URL (e.g., `https://your-app-name.railway.app`)

## Step 3: Update Frontend Configuration

1. **Add Environment Variable to Vercel**:
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add a new variable:
     - **Name**: `NEXT_PUBLIC_WEBSOCKET_URL`
     - **Value**: `https://your-railway-app.railway.app`
     - **Environment**: Production (and Preview if needed)

2. **Redeploy Frontend**:
   - Trigger a new deployment on Vercel
   - The frontend will now connect to your Railway WebSocket server

## Step 4: Test the Connection

1. **Health Check**:
   - Visit `https://your-railway-app.railway.app/health`
   - You should see a JSON response with server status

2. **Test WebSocket Connection**:
   - Open your Vercel app
   - Navigate to a request page
   - Check the browser console for WebSocket connection logs
   - The WebSocket status indicator should show "Live Chat"

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Make sure `ALLOWED_ORIGINS` includes your Vercel app URL
   - Check that `FRONTEND_URL` is set correctly

2. **Connection Refused**:
   - Verify the Railway app is running (check logs)
   - Ensure the WebSocket URL is correct in your frontend

3. **MongoDB Connection Issues**:
   - Verify your `MONGODB_URI` is correct
   - Check that your MongoDB allows connections from Railway's IPs

### Checking Logs

- Go to your Railway project dashboard
- Click on the "Deployments" tab
- Click on the latest deployment
- View the logs to see any errors

### Environment Variables

Make sure all required environment variables are set:
- `PORT` (Railway sets this automatically, but you can override)
- `NODE_ENV=production`
- `MONGODB_URI` (your MongoDB connection string)
- `ALLOWED_ORIGINS` (comma-separated list of allowed origins)
- `FRONTEND_URL` (your Vercel app URL)

## Monitoring

- **Health Check**: `GET /health` - Returns server status and connection count
- **Railway Dashboard**: Monitor resource usage and logs
- **Vercel Analytics**: Monitor frontend performance

## Scaling

Railway automatically handles scaling based on traffic. For high-traffic applications:
- Consider upgrading your Railway plan
- Monitor resource usage in the dashboard
- Set up alerts for high CPU/memory usage

## Security

- Keep your environment variables secure
- Use HTTPS for all connections
- Regularly update dependencies
- Monitor logs for suspicious activity
