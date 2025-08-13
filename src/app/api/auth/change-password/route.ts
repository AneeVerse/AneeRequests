import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/authService'

export async function POST(request: NextRequest) {
  try {
    const { userId, currentPassword, newPassword } = await request.json()

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'User ID, current password, and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Change password
    const result = await AuthService.changePassword(userId, currentPassword, newPassword)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Password change failed' },
      { status: 400 }
    )
  }
}
