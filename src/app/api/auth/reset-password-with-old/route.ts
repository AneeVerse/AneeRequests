import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { User } from '@/lib/models/schemas'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, oldPassword, newPassword, confirmPassword } = await request.json()

    // Validation
    if (!email || !oldPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ 
        error: 'All fields are required' 
      }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ 
        error: 'New passwords do not match' 
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
        error: 'No account found with this email address' 
      }, { status: 404 })
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password)
    if (!isOldPasswordValid) {
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
      message: 'Password updated successfully. You can now log in with your new password.'
    })

  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json({ 
      error: 'Failed to reset password' 
    }, { status: 500 })
  }
}
