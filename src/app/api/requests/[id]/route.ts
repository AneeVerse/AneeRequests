import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Request as RequestModel, ActivityLogEntry } from '@/lib/models/schemas'

type PopulatedRequestDoc = {
  _id: unknown
  client_id?: { _id: unknown } | undefined
  [key: string]: unknown
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await connectDB()
    const requestData = await RequestModel
      .findById(id)
      .populate('client_id')
      .lean<PopulatedRequestDoc>()
    
    if (!requestData) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const withIds = {
      ...requestData,
      id: String(requestData._id),
      client: requestData.client_id ? {
        ...(requestData.client_id as Record<string, unknown>),
        id: String((requestData.client_id as { _id: unknown })._id),
        name: (requestData.client_id as Record<string, unknown>).name,
        email: (requestData.client_id as Record<string, unknown>).email,
        client_company: (requestData.client_id as Record<string, unknown>).client_company_name ? {
          name: (requestData.client_id as Record<string, unknown>).client_company_name as string
        } : undefined
      } : undefined
    }

    return NextResponse.json(withIds)
  } catch (error) {
    console.error('Error fetching request:', error)
    return NextResponse.json({ error: 'Failed to fetch request' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await connectDB()
    const body = await request.json()
    const { action, description, entity_type, metadata } = body as {
      action: string
      description?: string
      entity_type?: string
      metadata?: Record<string, unknown>
    }

    if (!action) {
      return NextResponse.json({ 
        error: 'action is required' 
      }, { status: 400 })
    }

    const activity = await new ActivityLogEntry({
      request_id: id,
      org_id: 'default', // Add default org_id
      action,
      description,
      entity_type,
      metadata,
      created_at: new Date()
    }).save()

    const obj = activity.toObject()
    const activityWithId = { ...obj, id: String(obj._id) }

    // Broadcast to WebSocket server for real-time updates
    try {
      const websocketUrl = process.env.WEBSOCKET_SERVER_URL || 'http://localhost:3001'
      await fetch(`${websocketUrl}/api/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: id,
          event: 'newMessage',
          messageData: activityWithId
        })
      })
    } catch (error) {
      console.error('Failed to broadcast message:', error)
    }

    return NextResponse.json(activityWithId, { status: 201 })
  } catch (error) {
    console.error('Error logging activity:', error)
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await connectDB()
    
    // Delete all activity log entries for this request
    await ActivityLogEntry.deleteMany({ request_id: id })
    
    // Delete the request
    const deletedRequest = await RequestModel.findByIdAndDelete(id)
    
    if (!deletedRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Request deleted successfully' })
  } catch (error) {
    console.error('Error deleting request:', error)
    return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await connectDB()
    const body = await request.json()
    const { status, priority, due_date, assigned_to, description } = body

    // Validate the update data
    const updateData: Record<string, unknown> = {}
    
    if (status && ['submitted', 'in_progress', 'pending_response', 'completed', 'closed', 'cancelled'].includes(status)) {
      updateData.status = status
    } else if (status) {
      return NextResponse.json({ 
        error: `Invalid status value: ${status}. Valid values are: submitted, in_progress, pending_response, completed, closed, cancelled` 
      }, { status: 400 })
    }
    
    if (priority && ['none', 'low', 'medium', 'high', 'urgent'].includes(priority)) {
      updateData.priority = priority
    } else if (priority) {
      return NextResponse.json({ 
        error: `Invalid priority value: ${priority}. Valid values are: none, low, medium, high, urgent` 
      }, { status: 400 })
    }
    
    if (due_date) {
      updateData.due_date = new Date(due_date)
    }
    
    if (assigned_to !== undefined) {
      updateData.assigned_to = assigned_to || null
    }

    if (description !== undefined) {
      updateData.description = description
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        error: 'No valid fields to update' 
      }, { status: 400 })
    }

    updateData.updated_at = new Date()

    // Remove runValidators to avoid validation errors on existing documents
    // We're already validating the input data above
    const updatedRequest = await RequestModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: false }
    ).populate('client_id')

    if (!updatedRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const withIds = {
      ...updatedRequest.toObject(),
      id: String(updatedRequest._id),
      client: updatedRequest.client_id ? {
        ...(updatedRequest.client_id as Record<string, unknown>),
        id: String((updatedRequest.client_id as { _id: unknown })._id)
      } : undefined
    }

    return NextResponse.json(withIds)
  } catch (error) {
    console.error('Error updating request:', error)
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
  }
}
