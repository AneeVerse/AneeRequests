import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { TeamMember } from '@/lib/models/schemas'

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
    const { name, email, role } = body

    if (!name || !email) {
      return NextResponse.json({ 
        error: 'name and email are required' 
      }, { status: 400 })
    }

    // Check if email already exists
    const existingMember = await TeamMember.findOne({ email: email.toLowerCase() })
    if (existingMember) {
      return NextResponse.json({ 
        error: 'A team member with this email already exists' 
      }, { status: 400 })
    }

    const newTeamMember = new TeamMember({
      name,
      email,
      role: role || 'member'
    })

    await newTeamMember.save()

    return NextResponse.json({
      ...newTeamMember.toObject(),
      id: newTeamMember._id.toString()
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating team member:', error)
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
  }
}
