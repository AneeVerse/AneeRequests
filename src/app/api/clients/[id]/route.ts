import { NextRequest, NextResponse } from 'next/server'
import { ClientService } from '@/lib/services/clientService'

const clientService = new ClientService()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const client = await clientService.getClientById(id)
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }
    return NextResponse.json(client)
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const { name, email, client_company_name } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const updatedClient = await clientService.updateClient(id, {
      name,
      email,
      client_company_name
    })

    if (!updatedClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const deleted = await clientService.deleteClient(id)
    
    if (!deleted) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Client deleted successfully' })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
