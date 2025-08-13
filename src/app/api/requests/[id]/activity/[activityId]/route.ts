import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { ActivityLogEntry } from '@/lib/models/schemas'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; activityId: string }> }
) {
  try {
    await connectDB()
    const { id, activityId } = await params
    
    const result = await ActivityLogEntry.deleteOne({
      _id: activityId,
      request_id: id
    })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting activity:', error)
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    )
  }
}
