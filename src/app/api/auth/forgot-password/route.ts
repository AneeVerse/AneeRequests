import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/authService'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Request password reset
    const result = await AuthService.requestPasswordReset(email)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Password reset request failed' },
      { status: 400 }
    )
  }
}
