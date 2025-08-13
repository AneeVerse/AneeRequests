import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/authService'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json()

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Register user
    const user = await AuthService.registerUser(email, password, name, role || 'client')

    // Check if email verification is needed
    const isEmailConfigured = process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your-email@gmail.com'
    
    return NextResponse.json({
      message: isEmailConfigured 
        ? 'User registered successfully. Please check your email to verify your account.'
        : 'User registered successfully. Email verification is not configured.',
      user,
      verification_token: user.verification_token
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 400 }
    )
  }
}
