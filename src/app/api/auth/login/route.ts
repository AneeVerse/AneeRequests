import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/authService'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Login user
    const user = await AuthService.loginUser(email, password)

    return NextResponse.json({
      message: 'Login successful',
      user
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed' },
      { status: 401 }
    )
  }
}
