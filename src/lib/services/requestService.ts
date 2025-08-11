import { ObjectId } from 'mongodb'
import { getDb } from '../mongodb'
import { Request, RequestWithRelations, ActivityLogEntry, Client, ClientCompany, ServiceCatalogItem } from '../models/types'

export class RequestService {
  private async getRequestsCollection() {
    const db = await getDb()
    return db.collection<Request>('requests')
  }

  private async getClientsCollection() {
    const db = await getDb()
    return db.collection<Client>('clients')
  }

  private async getClientCompaniesCollection() {
    const db = await getDb()
    return db.collection<ClientCompany>('client_companies')
  }

  private async getServiceCatalogCollection() {
    const db = await getDb()
    return db.collection<ServiceCatalogItem>('service_catalog_items')
  }

  private async getActivityLogCollection() {
    const db = await getDb()
    return db.collection<ActivityLogEntry>('activity_log')
  }

  async getRequests(orgId: string): Promise<RequestWithRelations[]> {
    const collection = await this.getRequestsCollection()
    const requests = await collection.find({ org_id: orgId }).sort({ created_at: -1 }).toArray()
    
    // Get related data
    const clientIds = requests.map(r => r.client_id)
    const serviceIds = requests.filter(r => r.service_catalog_item_id).map(r => r.service_catalog_item_id!)

    const [clients, services] = await Promise.all([
      this.getClientsCollection().then(col => col.find({ _id: { $in: clientIds } }).toArray()),
      serviceIds.length > 0 ? this.getServiceCatalogCollection().then(col => col.find({ _id: { $in: serviceIds } }).toArray()) : []
    ])

    // Get company data for clients
    const companyIds = clients.filter(c => c.client_company_id).map(c => c.client_company_id!)
    const companies = companyIds.length > 0 
      ? await this.getClientCompaniesCollection().then(col => col.find({ _id: { $in: companyIds } }).toArray())
      : []

    return requests.map(request => {
      const client = clients.find(c => c._id?.toString() === request.client_id.toString())
      const service = services.find(s => s._id?.toString() === request.service_catalog_item_id?.toString())
      
      let clientWithCompany = client ? { ...client, id: client._id?.toString() } : undefined
      if (client?.client_company_id) {
        const company = companies.find(c => c._id?.toString() === client.client_company_id?.toString())
        if (company) {
          clientWithCompany = {
            ...clientWithCompany!,
            client_company: { ...company, id: company._id?.toString() }
          }
        }
      }

      return {
        ...request,
        id: request._id?.toString(),
        client: clientWithCompany,
        service_catalog_item: service ? { ...service, id: service._id?.toString() } : undefined
      }
    })
  }

  async getRequest(requestId: string): Promise<RequestWithRelations | null> {
    const collection = await this.getRequestsCollection()
    const request = await collection.findOne({ _id: new ObjectId(requestId) })
    
    if (!request) return null

    // Get related data
    const [client, service] = await Promise.all([
      this.getClientsCollection().then(col => col.findOne({ _id: request.client_id })),
      request.service_catalog_item_id 
        ? this.getServiceCatalogCollection().then(col => col.findOne({ _id: request.service_catalog_item_id! }))
        : null
    ])

    let clientWithCompany = client ? { ...client, id: client._id?.toString() } : undefined
    if (client?.client_company_id) {
      const company = await this.getClientCompaniesCollection().then(col => 
        col.findOne({ _id: client.client_company_id! })
      )
      if (company) {
        clientWithCompany = {
          ...clientWithCompany!,
          client_company: { ...company, id: company._id?.toString() }
        }
      }
    }

    return {
      ...request,
      id: request._id?.toString(),
      client: clientWithCompany,
      service_catalog_item: service ? { ...service, id: service._id?.toString() } : undefined
    }
  }

  async createRequest(data: {
    title: string
    description: string
    client_id: string
    service_catalog_item_id?: string
    org_id: string
  }): Promise<Request> {
    const now = new Date()
    const collection = await this.getRequestsCollection()
    
    const result = await collection.insertOne({
      title: data.title,
      description: data.description,
      status: 'submitted' as const,
      priority: 'medium' as const,
      client_id: new ObjectId(data.client_id),
      service_catalog_item_id: data.service_catalog_item_id ? new ObjectId(data.service_catalog_item_id) : undefined,
      org_id: data.org_id,
      created_at: now,
      updated_at: now
    })

    // Log activity
    await this.logActivity({
      org_id: data.org_id,
      request_id: result.insertedId.toString(),
      action: 'request_submitted',
      description: 'Request was submitted',
      entity_type: 'request'
    })

    const newRequest = await collection.findOne({ _id: result.insertedId })
    if (!newRequest) {
      throw new Error('Failed to create request')
    }

    return { ...newRequest, id: newRequest._id?.toString() }
  }

  async getActivityLog(requestId: string): Promise<ActivityLogEntry[]> {
    const collection = await this.getActivityLogCollection()
    const activities = await collection.find({ 
      request_id: new ObjectId(requestId) 
    }).sort({ created_at: -1 }).toArray()
    
    return activities.map(activity => ({
      ...activity,
      id: activity._id?.toString()
    }))
  }

  async logActivity(data: {
    org_id: string
    request_id: string
    action: string
    description?: string
    entity_type?: string
    metadata?: Record<string, any>
  }): Promise<ActivityLogEntry> {
    const collection = await this.getActivityLogCollection()
    
    const result = await collection.insertOne({
      org_id: data.org_id,
      request_id: new ObjectId(data.request_id),
      action: data.action,
      description: data.description,
      entity_type: data.entity_type,
      metadata: data.metadata,
      created_at: new Date()
    })

    const newActivity = await collection.findOne({ _id: result.insertedId })
    if (!newActivity) {
      throw new Error('Failed to log activity')
    }

    return { ...newActivity, id: newActivity._id?.toString() }
  }

  async getServiceCatalogItems(orgId: string): Promise<ServiceCatalogItem[]> {
    const collection = await this.getServiceCatalogCollection()
    const items = await collection.find({ org_id: orgId }).sort({ title: 1 }).toArray()
    
    return items.map(item => ({
      ...item,
      id: item._id?.toString()
    }))
  }

  // Helper method to create default service catalog items
  async createDefaultServiceItems(orgId: string): Promise<void> {
    const collection = await this.getServiceCatalogCollection()
    const now = new Date()

    const defaultServices = [
      {
        title: 'Web Development',
        description: 'Custom website development and design',
        org_id: orgId,
        created_at: now,
        updated_at: now
      },
      {
        title: 'Mobile App Development',
        description: 'iOS and Android mobile application development',
        org_id: orgId,
        created_at: now,
        updated_at: now
      },
      {
        title: 'Digital Marketing',
        description: 'SEO, social media, and digital advertising services',
        org_id: orgId,
        created_at: now,
        updated_at: now
      }
    ]

    await collection.insertMany(defaultServices)
  }
}
