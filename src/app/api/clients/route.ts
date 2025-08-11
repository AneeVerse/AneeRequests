import { NextRequest, NextResponse } from 'next/server'
import { ClientService } from '@/lib/services/clientService'

const clientService = new ClientService()

export async function GET() {
  try {
    const clients = await clientService.getClients()
    return NextResponse.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, client_company_name } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const client = await clientService.createClient({
      name,
      email,
      client_company_name
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
