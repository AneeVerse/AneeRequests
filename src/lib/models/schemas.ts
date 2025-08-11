import mongoose, { Schema, Document } from 'mongoose'

// Client Company Schema
export interface IClientCompany extends Document {
  name: string
  created_at: Date
  updated_at: Date
}

const clientCompanySchema = new Schema<IClientCompany>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
})

clientCompanySchema.pre('save', function(next) {
  this.updated_at = new Date()
  next()
})

// Client Schema
export interface IClient extends Document {
  name: string
  email?: string
  client_company_id?: mongoose.Types.ObjectId
  created_at: Date
  updated_at: Date
}

const clientSchema = new Schema<IClient>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  client_company_id: {
    type: Schema.Types.ObjectId,
    ref: 'ClientCompany'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
})

clientSchema.pre('save', function(next) {
  this.updated_at = new Date()
  next()
})

// Service Catalog Schema
export interface IServiceCatalogItem extends Document {
  title: string
  description: string
  created_at: Date
  updated_at: Date
}

const serviceCatalogSchema = new Schema<IServiceCatalogItem>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
})

serviceCatalogSchema.pre('save', function(next) {
  this.updated_at = new Date()
  next()
})

// Request Schema
export interface IRequest extends Document {
  title: string
  description: string
  status: 'submitted' | 'in_progress' | 'in_review' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  client_id: mongoose.Types.ObjectId
  service_catalog_item_id?: mongoose.Types.ObjectId
  assigned_to?: mongoose.Types.ObjectId
  due_date?: Date
  created_at: Date
  updated_at: Date
}

const requestSchema = new Schema<IRequest>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['submitted', 'in_progress', 'in_review', 'completed', 'cancelled'],
    default: 'submitted'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  client_id: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  service_catalog_item_id: {
    type: Schema.Types.ObjectId,
    ref: 'ServiceCatalogItem'
  },
  assigned_to: {
    type: Schema.Types.ObjectId
  },
  due_date: {
    type: Date
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
})

requestSchema.pre('save', function(next) {
  this.updated_at = new Date()
  next()
})

// Activity Log Schema
export interface IActivityLogEntry extends Document {
  request_id: mongoose.Types.ObjectId
  action: string
  description?: string
  entity_type?: string
  metadata?: Record<string, any>
  created_at: Date
}

const activityLogSchema = new Schema<IActivityLogEntry>({
  request_id: {
    type: Schema.Types.ObjectId,
    ref: 'Request',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  entity_type: {
    type: String
  },
  metadata: {
    type: Schema.Types.Mixed
  },
  created_at: {
    type: Date,
    default: Date.now
  }
})

// Team Member Schema
export interface ITeamMember extends Document {
  name: string
  email: string
  role: 'admin' | 'member' | 'viewer'
  status: 'active' | 'inactive' | 'pending'
  created_at: Date
  updated_at: Date
}

const teamMemberSchema = new Schema<ITeamMember>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['admin', 'member', 'viewer'],
    default: 'member'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
})

teamMemberSchema.pre('save', function(next) {
  this.updated_at = new Date()
  next()
})

// Invoice Line Item Schema
export interface IInvoiceLineItem extends Document {
  description: string
  service_catalog_item_id?: mongoose.Types.ObjectId
  rate: number
  quantity: number
  line_total: number
}

const invoiceLineItemSchema = new Schema<IInvoiceLineItem>({
  description: {
    type: String,
    required: true,
    trim: true
  },
  service_catalog_item_id: {
    type: Schema.Types.ObjectId,
    ref: 'ServiceCatalogItem',
    required: false
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  line_total: {
    type: Number,
    required: true,
    min: 0
  }
})

// Invoice Schema
export interface IInvoice extends Document {
  invoice_number: string
  client_id: mongoose.Types.ObjectId
  date_of_issue: Date
  due_date?: Date
  payment_method?: string
  payment_reference?: string
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled'
  line_items: IInvoiceLineItem[]
  subtotal: number
  tax_amount?: number
  total: number
  notes?: string
  created_at: Date
  updated_at: Date
}

const invoiceSchema = new Schema<IInvoice>({
  invoice_number: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  client_id: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  date_of_issue: {
    type: Date,
    required: true,
    default: Date.now
  },
  due_date: {
    type: Date,
    required: false
  },
  payment_method: {
    type: String,
    required: false,
    trim: true
  },
  payment_reference: {
    type: String,
    required: false,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  line_items: [invoiceLineItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  tax_amount: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  notes: {
    type: String,
    required: false,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
})

invoiceSchema.pre('save', function(next) {
  this.updated_at = new Date()
  
  // Calculate totals
  this.subtotal = this.line_items.reduce((sum, item) => sum + item.line_total, 0)
  this.total = this.subtotal + (this.tax_amount || 0)
  
  // Generate invoice number if not provided
  if (!this.invoice_number) {
    const year = new Date().getFullYear()
    const timestamp = Date.now().toString().slice(-6)
    this.invoice_number = `INV-${year}${timestamp}`
  }
  
  next()
})

export const ClientCompany = mongoose.models.ClientCompany || mongoose.model<IClientCompany>('ClientCompany', clientCompanySchema)
export const Client = mongoose.models.Client || mongoose.model<IClient>('Client', clientSchema)
export const ServiceCatalogItem = mongoose.models.ServiceCatalogItem || mongoose.model<IServiceCatalogItem>('ServiceCatalogItem', serviceCatalogSchema)
export const Request = mongoose.models.Request || mongoose.model<IRequest>('Request', requestSchema)
export const ActivityLogEntry = mongoose.models.ActivityLogEntry || mongoose.model<IActivityLogEntry>('ActivityLogEntry', activityLogSchema)
export const TeamMember = mongoose.models.TeamMember || mongoose.model<ITeamMember>('TeamMember', teamMemberSchema)
export const Invoice = mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', invoiceSchema)
