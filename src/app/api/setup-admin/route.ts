import { NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/authService'
import { User } from '@/lib/models/schemas'
import connectDB from '@/lib/mongodb'

export async function POST() {
  try {
    // Admin credentials
    const adminEmail = '4d.x.art@gmail.com'
    const adminPassword = 'Ahmad@Andy@786'
    const adminName = 'Admin User'

    // Check if admin already exists
    await connectDB()
    const existingAdmin = await User.findOne({ email: adminEmail })
    
    if (existingAdmin) {
      return NextResponse.json({
        message: 'Admin user already exists',
        user: {
          id: existingAdmin._id.toString(),
          email: existingAdmin.email,
          name: existingAdmin.name,
          role: existingAdmin.role
        }
      })
    }

    // Create admin user
    const admin = await AuthService.registerUser(adminEmail, adminPassword, adminName, 'admin')

    return NextResponse.json({
      message: 'Admin user created successfully',
      user: admin
    })
  } catch (error) {
    console.error('Setup admin error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to setup admin' },
      { status: 500 }
    )
  }
}
