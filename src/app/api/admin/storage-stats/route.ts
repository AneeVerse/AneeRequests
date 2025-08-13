import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Request, ActivityLogEntry, Client, User } from '@/lib/models/schemas'

export async function GET() {
  try {
    await connectDB()
    
    // Get counts using mongoose models
    const totalRequests = await Request.countDocuments()
    const totalActivities = await ActivityLogEntry.countDocuments()
    const totalClients = await Client.countDocuments()
    const totalUsers = await User.countDocuments()
    
    // Calculate total documents
    const totalDocuments = totalRequests + totalActivities + totalClients + totalUsers
    
    // Estimate storage size (rough calculation)
    const estimatedSizeMB = Math.round(totalDocuments * 0.5) // Rough estimate: 0.5KB per document
    
    // Define storage capacity (you can adjust this based on your MongoDB plan)
    const totalStorageCapacityMB = 512 // 512 MB for free tier, adjust as needed
    const remainingStorageMB = Math.max(0, totalStorageCapacityMB - estimatedSizeMB)
    const storageUsagePercentage = Math.round((estimatedSizeMB / totalStorageCapacityMB) * 100)
    
    const stats = {
      totalSize: estimatedSizeMB,
      totalCapacity: totalStorageCapacityMB,
      remainingStorage: remainingStorageMB,
      usagePercentage: storageUsagePercentage,
      collections: 4, // We have 4 main collections
      documents: totalDocuments,
      indexes: 8, // Rough estimate of indexes
      lastUpdated: new Date().toISOString()
    }
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching storage stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch storage statistics' },
      { status: 500 }
    )
  }
}
