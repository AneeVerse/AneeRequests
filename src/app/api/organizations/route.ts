import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Client } from '@/lib/models/schemas'

export async function GET() {
  try {
    await connectDB()
    
    // Get all unique organization names from clients
    const organizations = await Client.aggregate([
      {
        $match: {
          client_company_name: { $exists: true, $ne: null }
        }
      },
      {
        $match: {
          client_company_name: { $ne: '' }
        }
      },
      {
        $group: {
          _id: '$client_company_name',
          clientCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 1,
          name: '$_id',
          clientCount: 1
        }
      },
      {
        $sort: { name: 1 }
      }
    ])

    return NextResponse.json(organizations)
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
}
