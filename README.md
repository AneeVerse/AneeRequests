# AneeRequests - Request Management Dashboard

A Next.js application for managing client requests with MongoDB integration.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory with the following content:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb+srv://aneerequests:Ahmad%40Andy%40786@cluster0.ba3t3mc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
DB_NAME=aneerequests

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Features

- **Dashboard**: Overview of requests, clients, and metrics
- **Client Management**: Create and manage clients with company associations
- **Request System**: Create and track requests (requires clients to be created first)
- **Team Management**: View team members and roles

## Current Status

✅ Dashboard page with metrics UI
✅ Client listing and creation functionality  
✅ Team page
✅ Basic requests page (disabled until clients exist)
✅ Navigation layout and sidebar
✅ MongoDB integration with proper schemas
✅ API routes for CRUD operations

## Next Steps

1. Test client creation and listing functionality
2. Implement request creation after clients are working
3. Add request detail pages
4. Implement authentication and authorization
5. Add real-time updates and notifications

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with native driver
- **Icons**: Lucide React
- **Styling**: Tailwind CSS

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── api/            # API routes
│   ├── clients/        # Client management pages
│   ├── requests/       # Request management pages
│   ├── team/           # Team management pages
│   └── layout.tsx      # Root layout with sidebar
├── components/         # Reusable React components
│   └── Layout.tsx      # Main navigation layout
└── lib/               # Utilities and services
    ├── models/        # TypeScript interfaces
    ├── services/      # Business logic services
    └── mongodb.ts     # Database connection
```