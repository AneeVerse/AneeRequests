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

export type User = AdminUser | ClientUser

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
