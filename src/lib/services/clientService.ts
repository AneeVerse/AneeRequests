import connectDB from '../mongodb'
import { Client, ClientCompany, IClient, IClientCompany } from '../models/schemas'

export class ClientService {

  async getClients(): Promise<any[]> {
    await connectDB()
    
    const clients = await Client
      .find({})
      .populate('client_company_id')
      .sort({ created_at: -1 })
      .lean()
    
    return clients.map(client => ({
      ...client,
      id: client._id.toString(),
      client_company: client.client_company_id ? {
        ...client.client_company_id,
        id: client.client_company_id._id.toString()
      } : undefined
    }))
  }

  async createClient(data: { 
    name: string
    email?: string
    client_company_name?: string 
  }): Promise<any> {
    await connectDB()
    
    let clientCompanyId = undefined

    // Create company if provided
    if (data.client_company_name?.trim()) {
      // Check if company already exists
      let existingCompany = await ClientCompany.findOne({
        name: data.client_company_name.trim()
      })

      if (existingCompany) {
        clientCompanyId = existingCompany._id
      } else {
        const newCompany = new ClientCompany({
          name: data.client_company_name.trim()
        })
        await newCompany.save()
        clientCompanyId = newCompany._id
      }
    }

    // Create client
    const newClient = new Client({
      name: data.name.trim(),
      email: data.email?.trim() || undefined,
      client_company_id: clientCompanyId
    })

    await newClient.save()

    // Return client with populated company data
    const clientWithCompany = await Client
      .findById(newClient._id)
      .populate('client_company_id')
      .lean()

    return {
      ...clientWithCompany,
      id: clientWithCompany!._id.toString(),
      client_company: clientWithCompany!.client_company_id ? {
        ...clientWithCompany!.client_company_id,
        id: clientWithCompany!.client_company_id._id.toString()
      } : undefined
    }
  }

  async getClient(clientId: string): Promise<any | null> {
    await connectDB()
    
    const client = await Client
      .findById(clientId)
      .populate('client_company_id')
      .lean()
    
    if (!client) return null

    return {
      ...client,
      id: client._id.toString(),
      client_company: client.client_company_id ? {
        ...client.client_company_id,
        id: client.client_company_id._id.toString()
      } : undefined
    }
  }
}
