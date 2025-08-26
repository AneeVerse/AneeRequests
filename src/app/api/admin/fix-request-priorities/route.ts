import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Request } from '@/lib/models/schemas'

export async function POST() {
  try {
    await connectDB()
    
    // Find all requests that don't have a valid priority or have priority set to something other than the allowed values
    const validPriorities = ['none', 'low', 'medium', 'high', 'urgent']
    
    // Update requests that have invalid priority values to 'none'
    const result = await Request.updateMany(
      { priority: { $nin: validPriorities } },
      { $set: { priority: 'none' } }
    )
    
    // Also update requests that have no priority field set
    const result2 = await Request.updateMany(
      { priority: { $exists: false } },
      { $set: { priority: 'none' } }
    )
    
    return NextResponse.json({ 
      message: 'Request priorities fixed successfully',
      updatedInvalidPriorities: result.modifiedCount,
      updatedMissingPriorities: result2.modifiedCount,
      totalUpdated: result.modifiedCount + result2.modifiedCount
    })
  } catch (error) {
    console.error('Error fixing request priorities:', error)
    return NextResponse.json({ error: 'Failed to fix request priorities' }, { status: 500 })
  }
}

