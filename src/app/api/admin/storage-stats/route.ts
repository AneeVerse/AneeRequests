import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Request } from '@/lib/models/schemas'
import mongoose from 'mongoose'

export async function GET() {
  try {
    await connectDB()
    
    // Get total requests count
    const totalRequests = await Request.countDocuments()
    
    // Get requests by status
    const statusCounts = await Request.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ])
    
    // Check for any requests with invalid status values
    const validStatuses = ['submitted', 'in_progress', 'pending_response', 'completed', 'closed', 'cancelled']
    const invalidStatusRequests = await Request.find({
      status: { $nin: validStatuses }
    }).select('_id title status').limit(10)
    
    // Get database info
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not established')
    }
    const collections = await db.listCollections().toArray()
    
    // Get database stats
    let dbStats
    try {
      dbStats = await db.stats()
    } catch (error) {
      console.warn('Could not get database stats:', error)
      dbStats = { dataSize: 0, indexes: 0 }
    }
    
    // Calculate storage usage
    const totalSizeBytes = dbStats.dataSize || 0
    const totalSizeMB = Math.round(totalSizeBytes / (1024 * 1024) * 100) / 100
    const totalCapacityMB = 512 // Set a reasonable capacity limit
    const totalCapacityBytes = totalCapacityMB * 1024 * 1024
    const remainingStorageMB = Math.max(0, totalCapacityMB - totalSizeMB)
    // Calculate percentage with higher precision to avoid rounding to 0 for small values
    const usagePercentage = Math.max(0, Math.round((totalSizeBytes / totalCapacityBytes) * 100 * 100) / 100)
    
    return NextResponse.json({
      success: true,
      database: {
        name: db.databaseName,
        collections: collections.length,
        totalSize: totalSizeMB,
        totalCapacity: totalCapacityMB,
        remainingStorage: remainingStorageMB,
        usagePercentage: usagePercentage,
        indexes: dbStats.indexes || 0
      },
      requests: {
        total: totalRequests,
        byStatus: statusCounts,
        invalidStatusCount: invalidStatusRequests.length,
        invalidStatusExamples: invalidStatusRequests
      }
    })
  } catch (error) {
    console.error('Error getting storage stats:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
