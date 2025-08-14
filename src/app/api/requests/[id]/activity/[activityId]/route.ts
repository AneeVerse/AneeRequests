import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { ActivityLogEntry } from '@/lib/models/schemas'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; activityId: string }> }
) {
  try {
    await connectDB()
    const { id, activityId } = await params
    const body = await request.json()
    
    // Only allow updating description for message_posted activities
    const activity = await ActivityLogEntry.findOne({
      _id: activityId,
      request_id: id
    })
    
    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      )
    }
    
    if (activity.action !== 'message_posted') {
      return NextResponse.json(
        { error: 'Only messages can be edited' },
        { status: 400 }
      )
    }
    
    // Update the activity
    const updatedActivity = await ActivityLogEntry.findByIdAndUpdate(
      activityId,
      { 
        description: body.description,
        updated_at: new Date()
      },
      { new: true }
    )
    
    if (!updatedActivity) {
      return NextResponse.json(
        { error: 'Failed to update activity' },
        { status: 500 }
      )
    }
    
    const activityObj = updatedActivity.toObject()
    
    return NextResponse.json({
      ...activityObj,
      id: activityObj._id.toString()
    })
  } catch (error) {
    console.error('Error updating activity:', error)
    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    )
  }
}

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
