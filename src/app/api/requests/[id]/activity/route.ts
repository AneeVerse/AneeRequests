import { NextRequest, NextResponse } from 'next/server'
import { RequestService } from '@/lib/services/requestService'

const requestService = new RequestService()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const activities = await requestService.getActivityLog(params.id)
    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching activity log:', error)
    return NextResponse.json({ error: 'Failed to fetch activity log' }, { status: 500 })
  }
}
