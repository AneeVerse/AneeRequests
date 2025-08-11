import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Request, Client, ServiceCatalogItem } from '@/lib/models/schemas'

export async function GET() {
  try {
    await connectDB()
    
    const requests = await Request
      .find({})
      .populate('client_id')
      .populate('service_catalog_item_id')
      .sort({ created_at: -1 })
      .lean()

    const requestsWithIds = requests.map(request => ({
      ...request,
      id: request._id.toString(),
      client: request.client_id ? {
        ...request.client_id,
        id: request.client_id._id.toString()
      } : undefined,
      service_catalog_item: request.service_catalog_item_id ? {
        ...request.service_catalog_item_id,
        id: request.service_catalog_item_id._id.toString()
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
    const { title, description, client_id, service_catalog_item_id } = body

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

    // Return request with populated client data
    const requestWithData = await Request
      .findById(newRequest._id)
      .populate('client_id')
      .populate('service_catalog_item_id')
      .lean()

    return NextResponse.json({
      ...requestWithData,
      id: requestWithData!._id.toString()
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating request:', error)
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
  }
}
