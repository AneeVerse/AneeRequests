import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { User } from '@/lib/models/schemas'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, email } = body || {}

    if (!id) {
      return NextResponse.json({ error: 'User id is required' }, { status: 400 })
    }

    await connectDB()

    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (typeof name === 'string' && name.trim().length > 0) {
      user.name = name.trim()
    }

    if (typeof email === 'string' && email.trim().length > 0 && email !== user.email) {
      const exists = await User.findOne({ email: email.trim() })
      if (exists && exists._id.toString() !== id) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }
      user.email = email.trim()
    }

    await user.save()

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
