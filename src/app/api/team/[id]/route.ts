import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { TeamMember, User } from '@/lib/models/schemas'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

type TeamMemberLean = {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  role: 'admin' | 'portal_admin' | 'member' | 'viewer'
  status: 'active' | 'inactive' | 'pending'
  can_view_client_portal?: boolean
  created_at?: Date
  __v?: number
} | null

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    const teamMember = (await TeamMember.findById(id).lean()) as TeamMemberLean
    
    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...teamMember,
      id: teamMember._id.toString()
    })
  } catch (error) {
    console.error('Error fetching team member:', error)
    return NextResponse.json({ error: 'Failed to fetch team member' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { name, email, role, status, password, can_view_client_portal } = body

    const memberId = (await params).id
    const updatedMember = (await TeamMember.findByIdAndUpdate(
      memberId,
      { name, email, role, status, can_view_client_portal },
      { new: true }
    ).lean()) as TeamMemberLean

    if (!updatedMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // Always update corresponding auth user when role, name, or email changes
    if (email) {
      try {
        let authUser = await User.findOne({ email })
        if (authUser) {
          // Update existing user
          authUser.name = name
          authUser.role = role === 'admin' ? 'admin' : role === 'portal_admin' ? 'portal_admin' : role
          authUser.team_member_id = memberId as unknown as mongoose.Types.ObjectId
          authUser.is_verified = true
          
          // Update password if provided
          if (password) {
            const hashed = await bcrypt.hash(password, 12)
            authUser.password = hashed
          }
          
          await authUser.save()
        } else {
          // Create new user if doesn't exist
          const hashed = password ? await bcrypt.hash(password, 12) : await bcrypt.hash('temp123', 12)
          authUser = new User({
            email,
            password: hashed,
            name,
            role: role === 'admin' ? 'admin' : role === 'portal_admin' ? 'portal_admin' : role,
            team_member_id: memberId,
            is_verified: true
          })
          await authUser.save()
        }
      } catch (e) {
        console.error('Failed to update auth user for team member', e)
      }
    }

    return NextResponse.json({
      ...updatedMember,
      id: updatedMember._id.toString()
    })
  } catch (error) {
    console.error('Error updating team member:', error)
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    const deletedMember = (await TeamMember.findByIdAndDelete(id).lean()) as TeamMemberLean
    
    if (!deletedMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Team member deleted successfully' })
  } catch (error) {
    console.error('Error deleting team member:', error)
    return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 })
  }
}
