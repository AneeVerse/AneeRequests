import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Request, ActivityLogEntry } from '@/lib/models/schemas'

type PopulatedRequest = {
  _id: unknown
  client_id?: { _id: unknown } | undefined
  [key: string]: unknown
}

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')
    
    let query = {}
    if (clientId) {
      query = { client_id: clientId }
    }
    
    const requests = await Request
      .find(query)
      .populate({
        path: 'client_id',
        model: 'Client'
      })
      .sort({ created_at: -1 })
      .lean<PopulatedRequest[]>()

    const requestsWithIds = requests.map((request) => {
      const clientData = request.client_id as Record<string, unknown> | undefined;
      
      return {
        ...request,
        id: String(request._id),
        client: clientData ? {
          ...clientData,
          id: String((clientData as { _id: unknown })._id),
          client_company: clientData.client_company_name ? {
            name: clientData.client_company_name as string
          } : undefined
        } : undefined
      };
    })

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
    const { title, description, client_id } = body as {
      title: string
      description: string
      client_id: string
    }

    if (!title || !description || !client_id) {
      return NextResponse.json({ 
        error: 'title, description, and client_id are required' 
      }, { status: 400 })
    }

    const newRequest = new Request({
      title,
      description,
      client_id
    })

    await newRequest.save()

    // Create initial activity log entry with default org_id
    await new ActivityLogEntry({
      request_id: newRequest._id,
      org_id: 'default', // Add default org_id to satisfy validation
      action: 'request_submitted',
      description: 'Request was submitted',
      entity_type: 'request',
      created_at: new Date()
    }).save()

    const requestWithData = await Request
      .findById(newRequest._id)
      .populate('client_id')
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
