import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { User } from '@/lib/models/schemas'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, oldPassword, newPassword } = await request.json()

    if (!email || !oldPassword || !newPassword) {
      return NextResponse.json({ 
        error: 'Email, old password, and new password are required' 
      }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: 'New password must be at least 6 characters long' 
      }, { status: 400 })
    }

    await connectDB()

    // Find user by email
    const user = await User.findOne({ email })
    
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Verify old password
    const isValidOldPassword = await bcrypt.compare(oldPassword, user.password)
    if (!isValidOldPassword) {
      return NextResponse.json({ 
        error: 'Current password is incorrect' 
      }, { status: 400 })
    }

    // Hash new password
    const saltRounds = 12
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password
    user.password = hashedNewPassword
    await user.save()

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully. You can now log in with your new password.'
    })

  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json({ 
      error: 'Failed to reset password' 
    }, { status: 500 })
  }
}
