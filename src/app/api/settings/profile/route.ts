import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Profile } from '@/lib/models/schemas'

// For demo, we use a single profile document (first or create)

export async function GET() {
  try {
    await connectDB()
    let profile = await Profile.findOne({}).lean() as unknown as {
      _id: { toString(): string }
    } & Record<string, unknown> | null
    if (!profile) {
      profile = (await new Profile({ name: 'anees', email: '4d.x.art@gmail.com' }).save()).toObject()
    }
    return NextResponse.json({ ...profile, id: profile!._id.toString() })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const { name, email, language, avatar_url } = body

    let profile = await Profile.findOne({})
    if (!profile) {
      profile = new Profile({ name: name || 'User', email: email || 'user@example.com' })
    }

    if (name !== undefined) profile.name = name
    if (email !== undefined) profile.email = email
    if (language !== undefined) profile.language = language
    if (avatar_url !== undefined) profile.avatar_url = avatar_url

    await profile.save()
    const obj = profile.toObject()
    return NextResponse.json({ ...obj, id: obj._id.toString() })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
