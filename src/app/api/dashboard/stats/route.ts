import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Client, Request, TeamMember, Invoice } from '@/lib/models/schemas'

export async function GET() {
  try {
    await connectDB()
    
    // Get counts for dashboard metrics
    const [clientsCount, requestsCount, teamCount, paidInvoices] = await Promise.all([
      Client.countDocuments({}),
      Request.countDocuments({}),
      TeamMember.countDocuments({}),
      Invoice.find({ status: 'paid' }).lean()
    ])

    // Calculate revenue from paid invoices
    const revenue = paidInvoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0)

    // Get recent requests for the table
    const recentRequests = await Request
      .find({})
      .populate('client_id')
      .sort({ created_at: -1 })
      .limit(10)
      .lean()

    const requestsWithIds = recentRequests.map(request => ({
      ...request,
      id: (request._id as { toString(): string }).toString(),
      client: request.client_id ? {
        name: request.client_id.name,
        id: (request.client_id._id as { toString(): string }).toString()
      } : undefined
    }))

    return NextResponse.json({
      stats: {
        revenue: revenue,
        clients: clientsCount,
        requests: requestsCount,
        reviews: 0, // Placeholder for now
        team: teamCount
      },
      recentRequests: requestsWithIds
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
