import mongoose from 'mongoose'

// Client Schema
const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  client_company_name: String,
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
})

// User Schema for Authentication
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'client', 'member', 'viewer'], default: 'client' },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  team_member_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' },
  is_verified: { type: Boolean, default: false },
  verification_token: String,
  reset_password_token: String,
  reset_password_expires: Date,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
})

// Password Reset Token Schema
const passwordResetSchema = new mongoose.Schema({
  email: { type: String, required: true },
  token: { type: String, required: true },
  expires: { type: Date, required: true },
  created_at: { type: Date, default: Date.now }
})

// Request Schema
const requestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['submitted', 'in_progress', 'pending_response', 'completed', 'closed', 'cancelled'], default: 'submitted' },
  priority: { type: String, enum: ['none', 'low', 'medium', 'high', 'urgent'], default: 'none' },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  service_catalog_item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCatalogItem' },
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  org_id: { type: String, default: 'default' },
  due_date: Date,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
})

// Team Member Schema
const teamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
  status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active' },
  can_view_client_portal: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
})

// Invoice Schema
const invoiceSchema = new mongoose.Schema({
  invoice_number: { type: String, required: true, unique: true },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  date_of_issue: { type: Date, default: Date.now },
  due_date: Date,
  payment_method: String,
  payment_reference: String,
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'], default: 'draft' }, // Changed 'pending' to 'sent'
  line_items: [{
    description: { type: String, required: true },
    service_catalog_item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCatalogItem' },
    rate: { type: Number, required: true },
    quantity: { type: Number, required: true },
    line_total: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  tax_amount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  amount: { type: Number, required: true }, // Keep old field for backward compatibility
  notes: String,
  paid_date: Date,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
})

// Service Catalog Item Schema
const serviceCatalogItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String,
  created_at: { type: Date, default: Date.now }
})

// Activity Log Entry Schema
const activityLogEntrySchema = new mongoose.Schema({
  request_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
  org_id: { type: String, default: 'default' },
  action: { type: String, required: true },
  description: String,
  entity_type: String,
  metadata: mongoose.Schema.Types.Mixed,
  created_at: { type: Date, default: Date.now }
})

// Profile Schema
const profileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  first_name: String,
  last_name: String,
  phone: String,
  address: String,
  avatar_url: String,
  preferences: mongoose.Schema.Types.Mixed,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
})

export const Client = mongoose.models.Client || mongoose.model('Client', clientSchema)
export const User = mongoose.models.User || mongoose.model('User', userSchema)
export const PasswordReset = mongoose.models.PasswordReset || mongoose.model('PasswordReset', passwordResetSchema)
export const Request = mongoose.models.Request || mongoose.model('Request', requestSchema)
export const TeamMember = mongoose.models.TeamMember || mongoose.model('TeamMember', teamMemberSchema)
export const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema)
export const ServiceCatalogItem = mongoose.models.ServiceCatalogItem || mongoose.model('ServiceCatalogItem', serviceCatalogItemSchema)
export const ActivityLogEntry = mongoose.models.ActivityLogEntry || mongoose.model('ActivityLogEntry', activityLogEntrySchema)
export const Profile = mongoose.models.Profile || mongoose.model('Profile', profileSchema)
