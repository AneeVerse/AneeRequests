import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { TeamMember, User } from '@/lib/models/schemas'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    await connectDB()
    
    const teamMembers = await TeamMember
      .find({})
      .sort({ created_at: -1 })
      .lean()

    const teamMembersWithIds = teamMembers.map(member => ({
      ...member,
      id: (member._id as { toString(): string }).toString()
    }))

    return NextResponse.json(teamMembersWithIds)
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { name, email, role, password } = body
    const normalizedEmail = (email || '').toLowerCase().trim()

    if (!name || !email) {
      return NextResponse.json({ 
        error: 'name and email are required' 
      }, { status: 400 })
    }

    // Validate password upfront to avoid creating member then erroring
    if (password && password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 })
    }

    // Check if email already exists
    const existingMember = await TeamMember.findOne({ email: normalizedEmail })
    if (existingMember) {
      return NextResponse.json({ 
        error: 'A team member with this email already exists' 
      }, { status: 400 })
    }

    const newTeamMember = new TeamMember({
      name,
      email: normalizedEmail,
      role: role || 'member'
    })

    await newTeamMember.save()

    // Always create/update user account linked to this team member
    try {
      const existingUser = await User.findOne({ email: normalizedEmail })
      if (existingUser) {
        // Update existing user
        existingUser.name = name
        existingUser.role = role === 'admin' ? 'admin' : role === 'portal_admin' ? 'portal_admin' : (role || 'member')
        existingUser.team_member_id = newTeamMember._id
        existingUser.is_verified = true
        
        // Update password if provided
        if (password) {
          if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 })
          }
          const hashed = await bcrypt.hash(password, 12)
          existingUser.password = hashed
        }
        
        await existingUser.save()
      } else {
        // Create new user
        const hashed = password ? await bcrypt.hash(password, 12) : await bcrypt.hash('temp123', 12)
        const user = new User({
          email: normalizedEmail,
          password: hashed,
          name,
          role: role === 'admin' ? 'admin' : role === 'portal_admin' ? 'portal_admin' : (role || 'member'),
          team_member_id: newTeamMember._id,
          is_verified: true
        })
        await user.save()
      }
    } catch (e) {
      console.error('Failed to create/update auth user for team member', e)
    }

    return NextResponse.json({
      ...newTeamMember.toObject(),
      id: newTeamMember._id.toString()
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating team member:', error)
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
  }
}
