import connectDB from '../mongodb'
import { Client, ClientCompany } from '../models/schemas'

export class ClientService {

  async getClients(): Promise<Array<ReturnType<typeof mapClientDoc>>> {
    await connectDB()
    
    const clients = await Client
      .find({})
      .populate('client_company_id')
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
    
    let clientCompanyId = undefined as unknown as string | undefined

    if (data.client_company_name?.trim()) {
      const existingCompany = await ClientCompany.findOne({
        name: data.client_company_name.trim()
      })

      if (existingCompany) {
        clientCompanyId = existingCompany._id.toString()
      } else {
        const newCompany = new ClientCompany({
          name: data.client_company_name.trim()
        })
        await newCompany.save()
        clientCompanyId = newCompany._id.toString()
      }
    }

    const newClient = new Client({
      name: data.name.trim(),
      email: data.email?.trim() || undefined,
      client_company_id: clientCompanyId
    })

    await newClient.save()

    const clientWithCompany = await Client
      .findById(newClient._id)
      .populate('client_company_id')
      .lean()

    return mapClientDoc(clientWithCompany!)
  }

  async getClient(clientId: string): Promise<ReturnType<typeof mapClientDoc> | null> {
    await connectDB()
    
    const client = await Client
      .findById(clientId)
      .populate('client_company_id')
      .lean()
    
    if (!client) return null

    return mapClientDoc(client)
  }
}

function mapClientDoc(doc: unknown) {
  const typed = doc as {
    _id: { toString(): string }
    client_company_id?: { _id: { toString(): string } } & Record<string, unknown>
  } & Record<string, unknown>
  return {
    ...typed,
    id: typed._id.toString(),
    client_company: typed.client_company_id ? {
      ...typed.client_company_id,
      id: typed.client_company_id._id.toString()
    } : undefined
  }
}
