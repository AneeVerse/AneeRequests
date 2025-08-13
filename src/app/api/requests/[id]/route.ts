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
        id: String((requestData.client_id as { _id: unknown })._id)
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
    return NextResponse.json({ ...obj, id: String(obj._id) }, { status: 201 })
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
