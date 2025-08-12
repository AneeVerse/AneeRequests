import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { ServiceCatalogItem } from '@/lib/models/schemas'

export async function GET() {
  try {
    await connectDB()
    
    let items = await ServiceCatalogItem.find({}).sort({ title: 1 }).lean()
    
    // If no items exist, create default ones
    if (items.length === 0) {
      const defaultServices = [
        {
          title: 'Web Development',
          description: 'Custom website development and design'
        },
        {
          title: 'Mobile App Development',
          description: 'iOS and Android mobile application development'
        },
        {
          title: 'Digital Marketing',
          description: 'SEO, social media, and digital advertising services'
        }
      ]

      await ServiceCatalogItem.insertMany(defaultServices)
      items = await ServiceCatalogItem.find({}).sort({ title: 1 }).lean()
    }

    const itemsWithIds = items.map(item => ({
      ...item,
      id: (item._id as { toString(): string }).toString()
    }))

    return NextResponse.json(itemsWithIds)
  } catch (error) {
    console.error('Error fetching service catalog:', error)
    return NextResponse.json({ error: 'Failed to fetch service catalog' }, { status: 500 })
  }
}
