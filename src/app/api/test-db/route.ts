import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'

export async function GET() {
  try {
    console.log('Testing MongoDB connection...')
    console.log('MongoDB URI exists:', !!process.env.MONGODB_URI)
    console.log('MongoDB URI starts with:', process.env.MONGODB_URI?.substring(0, 20) + '...')
    
    await connectDB()
    console.log('Database connected successfully')
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray()
    console.log('Collections found:', collections.length)
    
    return NextResponse.json({ 
      success: true, 
      message: 'MongoDB connection successful (Mongoose)',
      collections: collections.length,
      dbName: mongoose.connection.db.databaseName,
      connectionState: mongoose.connection.readyState
    })
  } catch (error) {
    console.error('MongoDB connection error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
