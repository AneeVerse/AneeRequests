import connectDB from '../mongodb'
import { Client } from '../models/schemas'

export class ClientService {

  async getClients(): Promise<Array<ReturnType<typeof mapClientDoc>>> {
    await connectDB()
    
    const clients = await Client
      .find({})
      .sort({ created_at: -1 })
      .lean()
    
    return clients.map(mapClientDoc)
  }

  async createClient(data: { 
    name: string
    email?: string
    client_company_name?: string 
  }): Promise<ReturnType<typeof mapClientDoc>> {
    await connectDB()

    const newClient = new Client({
      name: data.name.trim(),
      email: data.email?.trim() || undefined,
      client_company_name: data.client_company_name?.trim() || undefined
    })

    await newClient.save()

    const client = await Client
      .findById(newClient._id)
      .lean()

    return mapClientDoc(client!)
  }

  async getClient(clientId: string): Promise<ReturnType<typeof mapClientDoc> | null> {
    await connectDB()
    
    const client = await Client
      .findById(clientId)
      .lean()
    
    if (!client) return null

    return mapClientDoc(client)
  }

  async getClientById(clientId: string): Promise<ReturnType<typeof mapClientDoc> | null> {
    return this.getClient(clientId)
  }

  async updateClient(clientId: string, data: { 
    name: string
    email?: string
    client_company_name?: string 
  }): Promise<ReturnType<typeof mapClientDoc> | null> {
    await connectDB()

    const updateData: {
      name: string;
      email?: string;
      client_company_name?: string;
    } = {
      name: data.name.trim(),
      email: data.email?.trim() || undefined,
      client_company_name: data.client_company_name?.trim() || undefined
    }

    const updatedClient = await Client
      .findByIdAndUpdate(
        clientId,
        updateData,
        { new: true }
      )
      .lean()

    if (!updatedClient) return null

    return mapClientDoc(updatedClient)
  }

  async deleteClient(clientId: string): Promise<boolean> {
    await connectDB()
    
    const result = await Client.findByIdAndDelete(clientId)
    return !!result
  }
}

function mapClientDoc(doc: unknown) {
  const typed = doc as {
    _id: { toString(): string }
    client_company_name?: string
  } & Record<string, unknown>
  return {
    ...typed,
    id: typed._id.toString(),
    client_company: typed.client_company_name ? {
      name: typed.client_company_name
    } : undefined
  }
}
