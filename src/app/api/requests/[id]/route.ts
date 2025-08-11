import { NextRequest, NextResponse } from 'next/server'
import { RequestService } from '@/lib/services/requestService'

const requestService = new RequestService()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestData = await requestService.getRequest(params.id)
    
    if (!requestData) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    return NextResponse.json(requestData)
  } catch (error) {
    console.error('Error fetching request:', error)
    return NextResponse.json({ error: 'Failed to fetch request' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { action, description, entity_type, metadata, org_id } = body

    if (!org_id || !action) {
      return NextResponse.json({ 
        error: 'org_id and action are required' 
      }, { status: 400 })
    }

    const activity = await requestService.logActivity({
      org_id,
      request_id: params.id,
      action,
      description,
      entity_type,
      metadata
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('Error logging activity:', error)
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 })
  }
}
