import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { TeamMember, User } from '@/lib/models/schemas'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

type TeamMemberLean = {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  role: 'admin' | 'member' | 'viewer'
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

    // If password provided, create/update corresponding auth user
    if (password && email) {
      try {
        let authUser = await User.findOne({ email })
        const hashed = await bcrypt.hash(password, 12)
        if (authUser) {
          authUser.password = hashed
          authUser.role = role
          authUser.team_member_id = memberId as unknown as any
          authUser.is_verified = true
          await authUser.save()
        } else {
          authUser = new User({
            email,
            password: hashed,
            name,
            role,
            team_member_id: memberId,
            is_verified: true
          })
          await authUser.save()
        }
      } catch (e) {
        console.error('Failed to update auth user password for team member', e)
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
