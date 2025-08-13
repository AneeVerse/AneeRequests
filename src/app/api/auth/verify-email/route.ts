import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/authService'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Verify email
    const user = await AuthService.verifyEmail(token)

    return NextResponse.json({
      message: 'Email verified successfully',
      user
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Email verification failed' },
      { status: 400 }
    )
  }
}
