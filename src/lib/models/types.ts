import { ObjectId } from 'mongodb'

export interface Client {
  _id?: ObjectId
  id?: string
  name: string
  email?: string
  client_company_name?: string
  created_at: Date
  updated_at: Date
}

export interface ServiceCatalogItem {
  _id?: ObjectId
  id?: string
  title: string
  description: string
  org_id: string
  created_at: Date
  updated_at: Date
}

export interface Request {
  _id?: ObjectId
  id?: string
  title: string
  description: string
  status: 'submitted' | 'in_progress' | 'in_review' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  client_id: ObjectId
  service_catalog_item_id?: ObjectId
  assigned_to?: ObjectId
  org_id: string
  due_date?: Date
  created_at: Date
  updated_at: Date
}

export interface ActivityLogEntry {
  _id?: ObjectId
  id?: string
  request_id: ObjectId
  org_id: string
  action: string
  description?: string
  entity_type?: string
  metadata?: Record<string, unknown>
  created_at: Date
}

export interface RequestWithRelations extends Omit<Request, 'client_id' | 'service_catalog_item_id'> {
  client?: Client
  service_catalog_item?: ServiceCatalogItem
}
