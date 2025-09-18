export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'admin'
}

export interface ClientUser {
  id: string
  email: string
  name: string
  role: 'client'
  clientId: string
  clientName: string
  clientCompany?: string
}

export interface TeamUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'portal_admin' | 'member' | 'viewer'
}

export type User = AdminUser | ClientUser | TeamUser

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  impersonating: boolean
  originalUser?: AdminUser
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
