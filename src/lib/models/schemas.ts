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
  role: { type: String, enum: ['admin', 'client'], default: 'client' },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
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
  status: { type: String, enum: ['submitted', 'in_progress', 'in_review', 'completed', 'cancelled'], default: 'submitted' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  service_catalog_item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCatalogItem' },
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
  created_at: { type: Date, default: Date.now }
})

// Invoice Schema
const invoiceSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'sent', 'paid', 'overdue'], default: 'draft' },
  due_date: Date,
  paid_date: Date,
  created_at: { type: Date, default: Date.now }
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
  org_id: { type: String, required: true },
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
