import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Request } from '@/lib/models/schemas'

type PopulatedRequest = {
  _id: unknown
  client_id?: { _id: unknown } | undefined
  service_catalog_item_id?: { _id: unknown } | undefined
  [key: string]: unknown
}

export async function GET() {
  try {
    await connectDB()
    
    const requests = await Request
      .find({})
      .populate('client_id')
      .populate('service_catalog_item_id')
      .sort({ created_at: -1 })
      .lean<PopulatedRequest[]>()

    const requestsWithIds = requests.map((request) => ({
      ...request,
      id: String(request._id),
      client: request.client_id ? {
        ...(request.client_id as Record<string, unknown>),
        id: String((request.client_id as { _id: unknown })._id)
      } : undefined,
      service_catalog_item: request.service_catalog_item_id ? {
        ...(request.service_catalog_item_id as Record<string, unknown>),
        id: String((request.service_catalog_item_id as { _id: unknown })._id)
      } : undefined
    }))

    return NextResponse.json(requestsWithIds)
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { title, description, client_id, service_catalog_item_id } = body as {
      title: string
      description: string
      client_id: string
      service_catalog_item_id?: string
    }

    if (!title || !description || !client_id) {
      return NextResponse.json({ 
        error: 'title, description, and client_id are required' 
      }, { status: 400 })
    }

    const newRequest = new Request({
      title,
      description,
      client_id,
      service_catalog_item_id
    })

    await newRequest.save()

    const requestWithData = await Request
      .findById(newRequest._id)
      .populate('client_id')
      .populate('service_catalog_item_id')
      .lean<PopulatedRequest>()

    return NextResponse.json({
      ...requestWithData,
      id: String(requestWithData!._id)
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating request:', error)
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
  }
}
