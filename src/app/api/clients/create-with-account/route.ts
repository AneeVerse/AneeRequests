import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/authService'
import { ClientService } from '@/lib/services/clientService'
import connectDB from '@/lib/mongodb'
import { Client, User } from '@/lib/models/schemas'

const clientService = new ClientService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, client_company_name, password, confirmPassword } = body

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json({ 
        error: 'Name, email, and password are required' 
      }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ 
        error: 'Passwords do not match' 
      }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ 
        error: 'Password must be at least 6 characters long' 
      }, { status: 400 })
    }

    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ 
        error: 'A user with this email already exists' 
      }, { status: 400 })
    }

    // Create user account first (auto-verify clients created by admin)
    const userData = await AuthService.registerUser(email, password, name, 'client')
    
    // Auto-verify the client since admin created the account
    await User.findByIdAndUpdate(userData.id, {
      is_verified: true,
      verification_token: undefined
    })
    
    // Update userData to reflect verification
    userData.is_verified = true
    
    // Create client record
    const clientData = await clientService.createClient({
      name,
      email,
      client_company_name
    })

    // Link the user to the client
    await User.findByIdAndUpdate(userData.id, {
      client_id: clientData.id
    })

    // Update client with user_id
    await Client.findByIdAndUpdate(clientData.id, {
      user_id: userData.id
    })

    return NextResponse.json({
      message: 'Client account created successfully',
      client: clientData,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        is_verified: userData.is_verified
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating client with account:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create client account' 
    }, { status: 500 })
  }
}
