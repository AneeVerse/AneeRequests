import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Client } from '@/lib/models/schemas'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { organizationName } = await request.json()
    
    if (!organizationName) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      )
    }

    await connectDB()
    
    const client = await Client.findById(id)
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Update client's organization
    client.client_company_name = organizationName.trim() || undefined
    await client.save()

    return NextResponse.json({
      message: 'Client organization updated successfully',
      client: {
        id: client._id.toString(),
        name: client.name,
        email: client.email,
        client_company_name: client.client_company_name
      }
    })
  } catch (error) {
    console.error('Error updating client organization:', error)
    return NextResponse.json(
      { error: 'Failed to update client organization' },
      { status: 500 }
    )
  }
}
