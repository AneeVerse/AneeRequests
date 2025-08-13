import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { ActivityLogEntry } from '@/lib/models/schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await connectDB()
    const activities = await ActivityLogEntry
      .find({ request_id: id })
      .sort({ created_at: 1 }) // Sort by oldest first for chat-like experience
      .lean()

    const withIds = activities.map(a => ({ ...a, id: a._id?.toString() }))
    return NextResponse.json(withIds)
  } catch (error) {
    console.error('Error fetching activity log:', error)
    return NextResponse.json({ error: 'Failed to fetch activity log' }, { status: 500 })
  }
}
