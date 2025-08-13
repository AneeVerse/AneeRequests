import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/authService'

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Reset password
    const result = await AuthService.resetPassword(token, newPassword)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Password reset failed' },
      { status: 400 }
    )
  }
}
