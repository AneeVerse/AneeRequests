import connectDB from '../mongodb'
import { Client, Request, Invoice, User } from '../models/schemas'
import mongoose from 'mongoose'

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
    
    console.log(`🔍 Starting deleteClient with ID: ${clientId}`)
    
    // Validate that clientId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      console.log(`❌ Invalid ObjectId format: ${clientId}`)
      return false
    }
    
    // First, check if the client exists
    const client = await Client.findById(clientId)
    if (!client) {
      console.log(`❌ Client with ID ${clientId} not found`)
      return false
    }
    
    console.log(`✅ Found client: ${client.name} (${clientId})`)
    
    try {
      // Check how many related records exist
      const requestsCount = await Request.countDocuments({ client_id: clientId })
      const invoicesCount = await Invoice.countDocuments({ client_id: clientId })
      const usersCount = await User.countDocuments({ client_id: clientId })
      
      console.log(`📊 Related records found: ${requestsCount} requests, ${invoicesCount} invoices, ${usersCount} users`)
      
      // Delete all related records in a transaction-like manner
      // Delete all requests for this client
      const deletedRequests = await Request.deleteMany({ client_id: clientId })
      console.log(`🗑️ Deleted ${deletedRequests.deletedCount} requests`)
      
      // Delete all invoices for this client
      const deletedInvoices = await Invoice.deleteMany({ client_id: clientId })
      console.log(`🗑️ Deleted ${deletedInvoices.deletedCount} invoices`)
      
      // Delete the associated user account (since client accounts are linked to users)
      if (client.user_id) {
        const deletedUser = await User.findByIdAndDelete(client.user_id)
        console.log(`👤 Deleted associated user account: ${deletedUser ? 'SUCCESS' : 'FAILED'}`)
      }
      
      // Also remove any other users that might reference this client (for safety)
      const updatedUsers = await User.updateMany(
        { client_id: clientId },
        { $unset: { client_id: "" } }
      )
      console.log(`👥 Updated ${updatedUsers.modifiedCount} other users`)
      
      // Finally, delete the client
      const result = await Client.findByIdAndDelete(clientId)
      console.log(`✅ Client deletion result:`, result ? 'SUCCESS' : 'FAILED')
      
      if (result) {
        console.log(`🎉 Client ${clientId} deleted successfully`)
      } else {
        console.log(`❌ Failed to delete client ${clientId}`)
      }
      
      return !!result
    } catch (error) {
      console.error('❌ Error deleting client and related records:', error)
      throw error
    }
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
