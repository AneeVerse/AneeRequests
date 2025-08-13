import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { User } from '@/lib/models/schemas'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 })
    }

    await connectDB()

    // Check if user exists
    const user = await User.findOne({ email })
    
    if (!user) {
      return NextResponse.json({ 
        exists: false,
        message: 'No account found with this email address' 
      })
    }

    return NextResponse.json({
      exists: true,
      message: 'Email found. Please enter your current password to reset.'
    })

  } catch (error) {
    console.error('Error checking email:', error)
    return NextResponse.json({ 
      error: 'Failed to check email' 
    }, { status: 500 })
  }
}
