import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Request, ServiceCatalogItem } from '@/lib/models/schemas'

export async function GET() {
  try {
    await connectDB()

    // Aggregate by status
    const byStatusAgg = await Request.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, label: '$_id', value: '$count' } },
    ])

    // Aggregate by service
    const byServiceAgg = await Request.aggregate([
      { $group: { _id: '$service_catalog_item_id', count: { $sum: 1 } } },
      { $lookup: { from: 'servicecatalogitems', localField: '_id', foreignField: '_id', as: 'svc' } },
      { $unwind: { path: '$svc', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, label: { $ifNull: ['$svc.title', 'No service'] }, value: '$count' } }
    ])

    // Daily counts for last 30 days
    const since = new Date()
    since.setDate(since.getDate() - 30)
    const dailyAgg = await Request.aggregate([
      { $match: { created_at: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } }, count: { $sum: 1 } } },
      { $project: { _id: 0, date: '$_id', value: '$count' } },
      { $sort: { date: 1 } }
    ])

    return NextResponse.json({ byStatus: byStatusAgg, byService: byServiceAgg, dailyCounts: dailyAgg })
  } catch (error) {
    console.error('Error building requests report:', error)
    return NextResponse.json({ error: 'Failed to build report' }, { status: 500 })
  }
}
