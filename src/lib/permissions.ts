import { User } from './types/auth'

export type Permission = 
  | 'view_dashboard'
  | 'view_requests'
  | 'create_requests'
  | 'edit_requests'
  | 'delete_requests'
  | 'view_clients'
  | 'create_clients'
  | 'edit_clients'
  | 'delete_clients'
  | 'view_team'
  | 'create_team'
  | 'edit_team'
  | 'delete_team'
  | 'view_invoices'
  | 'create_invoices'
  | 'edit_invoices'
  | 'delete_invoices'
  | 'view_reports'
  | 'admin_settings'
  | 'impersonate_users'
  | 'chat_requests'
  | 'assign_requests'

export interface RolePermissions {
  [key: string]: Permission[]
}

// Define permissions for each role
export const ROLE_PERMISSIONS: RolePermissions = {
  admin: [
    'view_dashboard',
    'view_requests',
    'create_requests',
    'edit_requests',
    'delete_requests',
    'view_clients',
    'create_clients',
    'edit_clients',
    'delete_clients',
    'view_team',
    'create_team',
    'edit_team',
    'delete_team',
    'view_invoices',
    'create_invoices',
    'edit_invoices',
    'delete_invoices',
    'view_reports',
    'admin_settings',
    'impersonate_users',
    'chat_requests',
    'assign_requests'
  ],
  'portal_admin': [
    'view_dashboard',
    'view_requests',
    'create_requests',
    'edit_requests',
    'delete_requests',
    'view_clients',
    'create_clients',
    'edit_clients',
    'delete_clients',
    'view_team',
    'create_team',
    'edit_team',
    'delete_team',
    'view_invoices',
    'create_invoices',
    'edit_invoices',
    'delete_invoices',
    'view_reports',
    'admin_settings',
    'impersonate_users',
    'chat_requests',
    'assign_requests'
  ],
  member: [
    'view_dashboard',
    'view_requests',
    'create_requests',
    'edit_requests',
    'view_clients',
    'view_team',
    'view_invoices',
    'chat_requests',
    'assign_requests'
  ],
  viewer: [
    'view_dashboard',
    'view_requests',
    'view_clients',
    'view_team',
    'view_invoices'
  ],
  client: [
    'view_dashboard',
    'view_requests',
    'create_requests',
    'chat_requests'
  ]
}

export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false
  
  const userRole = user.role
  const permissions = ROLE_PERMISSIONS[userRole] || []
  
  return permissions.includes(permission)
}

export function hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
  if (!user) return false
  
  return permissions.some(permission => hasPermission(user, permission))
}

export function hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
  if (!user) return false
  
  return permissions.every(permission => hasPermission(user, permission))
}

export function canAccessRoute(user: User | null, route: string): boolean {
  if (!user) return false
  
  // Define route permissions with pattern matching
  const routePermissions: { [key: string]: Permission[] } = {
    '/': ['view_dashboard'],
    '/requests': ['view_requests'],
    '/requests/new': ['create_requests'],
    '/clients': ['view_clients'],
    '/clients/new': ['create_clients'],
    '/team': ['view_team'],
    '/team/new': ['create_team'],
    '/invoices': ['view_invoices'],
    '/invoices/new': ['create_invoices'],
    '/reports': ['view_reports'],
    '/settings': ['admin_settings']
  }
  
  // Check for exact match first
  let requiredPermissions = routePermissions[route]
  
  // If no exact match, check for pattern matches
  if (!requiredPermissions) {
    if (route.startsWith('/invoices/')) {
      requiredPermissions = ['view_invoices']
    } else if (route.startsWith('/requests/')) {
      requiredPermissions = ['view_requests']
    } else if (route.startsWith('/clients/')) {
      requiredPermissions = ['view_clients']
    } else if (route.startsWith('/team/')) {
      requiredPermissions = ['view_team']
    } else if (route.startsWith('/settings/')) {
      requiredPermissions = ['admin_settings']
    }
  }
  
  // If still no permissions found, allow access (for routes not in our list)
  if (!requiredPermissions) {
    return true
  }
  
  return hasAnyPermission(user, requiredPermissions)
}

export function getRoleDisplayName(role: string): string {
  const roleNames: { [key: string]: string } = {
    admin: 'Admin',
    portal_admin: 'Portal Admin',
    member: 'Regular Member',
    viewer: 'Viewer',
    client: 'Client'
  }
  
  return roleNames[role] || role
}

export function getRoleDescription(role: string): string {
  const descriptions: { [key: string]: string } = {
    admin: 'Full system access with all permissions',
    portal_admin: 'Full portal access with admin privileges',
    member: 'Can view, edit, and chat on assigned items',
    viewer: 'Read-only access to assigned items',
    client: 'Client portal access for requests and communication'
  }
  
  return descriptions[role] || 'No description available'
}
