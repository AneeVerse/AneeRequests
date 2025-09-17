"use client"
import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { AuthState, User, AdminUser, ClientUser, LoginCredentials, ChangePasswordData } from '../types/auth'

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message: string }>
  logout: () => void
  impersonateClient: (clientId: string, clientName: string, clientEmail: string, clientCompany?: string) => void
  impersonateTeamMember: (memberId: string, memberName: string, memberEmail: string, memberRole?: 'admin' | 'member' | 'viewer') => void
  stopImpersonation: () => void
  changePassword: (data: ChangePasswordData) => Promise<{ success: boolean; message: string }>
  adminChangePassword: (newPassword: string, confirmPassword: string) => Promise<{ success: boolean; message: string }>
  updateProfile: (name: string, email: string) => void
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; message: string }>
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>
  checkEmail: (email: string) => Promise<{ success: boolean; exists: boolean; message: string; user?: { id: string; email: string; name: string; role: string } }>
  resetPasswordDirect: (email: string, oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>
  adminResetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; message: string }>
  adminSendTemporaryPassword: (email: string) => Promise<{ success: boolean; message: string; tempPassword?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'IMPERSONATE_CLIENT'; payload: { clientUser: ClientUser; originalUser: AdminUser } }
  | { type: 'IMPERSONATE_USER'; payload: { user: User; originalUser: AdminUser } }
  | { type: 'STOP_IMPERSONATION' }
  | { type: 'CHANGE_PASSWORD'; payload: string }
  | { type: 'UPDATE_PROFILE'; payload: { name: string; email: string } }

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.payload, isAuthenticated: true, isLoading: false, impersonating: false, originalUser: undefined }
    case 'LOGOUT':
      return { user: null, isAuthenticated: false, isLoading: false, impersonating: false, originalUser: undefined }
    case 'IMPERSONATE_CLIENT':
      return { ...state, user: action.payload.clientUser, impersonating: true, originalUser: action.payload.originalUser }
    case 'IMPERSONATE_USER':
      return { ...state, user: action.payload.user, impersonating: true, originalUser: action.payload.originalUser }
    case 'STOP_IMPERSONATION':
      return { ...state, user: state.originalUser || null, impersonating: false, originalUser: undefined }
    case 'CHANGE_PASSWORD':
      return state
    case 'UPDATE_PROFILE':
      if (state.user) {
        const updatedUser = { ...state.user, name: action.payload.name, email: action.payload.email }
        return { ...state, user: updatedUser }
      }
      return state
    default:
      return state
  }
}

const initialState: AuthState = { user: null, isAuthenticated: false, isLoading: true, impersonating: false }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    const checkAuth = () => {
      try {
        const savedUser = localStorage.getItem('auth_user')
        const savedImpersonation = localStorage.getItem('auth_impersonation')
        if (savedUser) {
          const user = JSON.parse(savedUser) as User
          dispatch({ type: 'LOGIN_SUCCESS', payload: user })
          if (savedImpersonation) {
            const impersonation = JSON.parse(savedImpersonation)
            if (impersonation.user) {
              dispatch({ type: 'IMPERSONATE_USER', payload: { user: impersonation.user, originalUser: impersonation.originalUser } })
            } else if (impersonation.clientUser) {
              dispatch({ type: 'IMPERSONATE_CLIENT', payload: { clientUser: impersonation.clientUser, originalUser: impersonation.originalUser } })
            }
          }
        } else {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } catch (error) {
        console.error('Error checking auth state:', error)
        // Clear corrupted localStorage data
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_impersonation')
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }
    checkAuth()
  }, [])

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; message: string }> => {
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      let user: User
      
      if (data.user.role === 'admin') {
        user = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: 'admin'
        } as AdminUser
      } else if (data.user.role === 'client') {
        user = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: 'client',
          clientId: data.user.client_id,
          clientName: data.user.name,
          clientCompany: 'Individual'
        } as ClientUser
      } else {
        // Team user (member/viewer)
        user = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
        } as User
      }
      
      try {
        localStorage.setItem('auth_user', JSON.stringify(user))
      } catch (storageError) {
        console.error('Error saving to localStorage:', storageError)
        // Continue with login even if localStorage fails
      }
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: user })
      
      return { success: true, message: 'Login successful' }
      
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false })
      return { success: false, message: error instanceof Error ? error.message : 'Login failed' }
    }
  }

  const logout = () => {
    try {
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_impersonation')
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
    dispatch({ type: 'LOGOUT' })
    // Redirect to login page
    window.location.href = '/login'
  }

  const impersonateClient = (clientId: string, clientName: string, clientEmail: string, clientCompany?: string) => {
    if (state.user?.role !== 'admin') return
    
    const clientUser: ClientUser = {
      id: `impersonated-${clientId}`,
      email: clientEmail,
      name: clientName,
      role: 'client',
      clientId,
      clientName,
      clientCompany
    }
    
    const impersonationData = {
      clientUser,
      originalUser: state.user as AdminUser
    }
    
    localStorage.setItem('auth_impersonation', JSON.stringify(impersonationData))
    dispatch({ type: 'IMPERSONATE_CLIENT', payload: impersonationData })
  }

  const impersonateTeamMember = (memberId: string, memberName: string, memberEmail: string, memberRole: 'admin' | 'member' | 'viewer' = 'member') => {
    if (state.user?.role !== 'admin') return

    const user: User = {
      id: `impersonated-team-${memberId}`,
      email: memberEmail,
      name: memberName,
      role: memberRole
    } as User

    const impersonationData = {
      user,
      originalUser: state.user as AdminUser
    }

    localStorage.setItem('auth_impersonation', JSON.stringify(impersonationData))
    dispatch({ type: 'IMPERSONATE_USER', payload: impersonationData })
  }

  const stopImpersonation = () => {
    localStorage.removeItem('auth_impersonation')
    dispatch({ type: 'STOP_IMPERSONATION' })
    // Redirect to login page when stopping impersonation
    window.location.href = '/login'
  }

  const changePassword = async (data: ChangePasswordData): Promise<{ success: boolean; message: string }> => {
    if (data.newPassword !== data.confirmPassword) {
      return { success: false, message: 'New passwords do not match' }
    }
    
    if (data.newPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' }
    }
    
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: state.user?.id,
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Password change failed')
      }

      dispatch({ type: 'CHANGE_PASSWORD', payload: data.newPassword })
      return { success: true, message: 'Password updated successfully' }
      
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Password change failed' }
    }
  }

  const adminChangePassword = async (newPassword: string, confirmPassword: string): Promise<{ success: boolean; message: string }> => {
    if (newPassword !== confirmPassword) {
      return { success: false, message: 'New passwords do not match' }
    }
    
    if (newPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' }
    }
    
    try {
      const response = await fetch('/api/auth/admin-change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: state.user?.id,
          newPassword: newPassword
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Password change failed')
      }

      dispatch({ type: 'CHANGE_PASSWORD', payload: newPassword })
      return { success: true, message: 'Password updated successfully' }
      
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Password change failed' }
    }
  }

  const updateProfile = (name: string, email: string) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: { name, email } })
  }

  const register = async (email: string, password: string, name: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, role: 'client' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      return { success: true, message: 'Registration successful. Please check your email to verify your account.' }
      
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Registration failed' }
    }
  }

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Password reset request failed')
      }

      return { success: true, message: 'Password reset email sent. Please check your inbox.' }
      
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Password reset request failed' }
    }
  }

  const checkEmail = async (email: string): Promise<{ success: boolean; exists: boolean; message: string; user?: { id: string; email: string; name: string; role: string } }> => {
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check email')
      }

      return { 
        success: true, 
        exists: data.exists, 
        message: data.message,
        user: data.user
      }
      
    } catch (error) {
      return { 
        success: false, 
        exists: false, 
        message: error instanceof Error ? error.message : 'Failed to check email' 
      }
    }
  }

  const resetPasswordDirect = async (email: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/auth/reset-password-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, oldPassword, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed')
      }

      return { success: true, message: data.message }
      
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Password reset failed' }
    }
  }

  const adminResetPassword = async (email: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/auth/admin-reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Admin password reset failed')
      }

      return { success: true, message: data.message }
      
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Admin password reset failed' }
    }
  }

  const adminSendTemporaryPassword = async (email: string): Promise<{ success: boolean; message: string; tempPassword?: string }> => {
    try {
      const response = await fetch('/api/auth/admin-send-temp-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send temporary password')
      }

      return { success: true, message: data.message, tempPassword: data.tempPassword }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to send temporary password' }
    }
  }

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    impersonateClient,
    impersonateTeamMember,
    stopImpersonation,
    changePassword,
    adminChangePassword,
    updateProfile,
    register,
    requestPasswordReset,
    checkEmail,
    resetPasswordDirect,
    adminResetPassword,
    adminSendTemporaryPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
