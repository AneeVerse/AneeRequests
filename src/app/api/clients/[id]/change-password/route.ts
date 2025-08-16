import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { User, Client } from '@/lib/models/schemas'
import bcrypt from 'bcryptjs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    const body = await request.json()
    
    if (!body.password || body.password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(body.password, 12)
    
    // Find the associated user by client id
    const client = await Client.findById(id)
    let userIdToUpdate = client?.user_id

    if (!userIdToUpdate) {
      const userByClient = await User.findOne({ client_id: id }).select('_id')
      userIdToUpdate = userByClient?._id
    }

    if (!userIdToUpdate) {
      return NextResponse.json(
        { error: 'Linked user not found for this client' },
        { status: 404 }
      )
    }

    // Update the user's password
    const updatedUser = await User.findByIdAndUpdate(
      userIdToUpdate,
      {
        password: hashedPassword,
        updated_at: new Date()
      },
      { new: true }
    )
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Password updated successfully' 
    })
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    )
  }
}
