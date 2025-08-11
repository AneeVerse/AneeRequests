import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Invoice, Client, ServiceCatalogItem } from '@/lib/models/schemas'

export async function GET() {
  try {
    await connectDB()
    
    const invoices = await Invoice
      .find({})
      .populate('client_id')
      .sort({ created_at: -1 })
      .lean()

    const invoicesWithIds = invoices.map(invoice => ({
      ...invoice,
      id: invoice._id.toString(),
      client: invoice.client_id ? {
        ...invoice.client_id,
        id: invoice.client_id._id.toString()
      } : undefined
    }))

    return NextResponse.json(invoicesWithIds)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { 
      client_id, 
      date_of_issue, 
      due_date,
      payment_method,
      payment_reference,
      status,
      line_items,
      tax_amount,
      notes 
    } = body

    if (!client_id || !line_items || line_items.length === 0) {
      return NextResponse.json({ 
        error: 'client_id and at least one line item are required' 
      }, { status: 400 })
    }

    // Validate and calculate line totals
    const processedLineItems = line_items.map((item: any) => ({
      ...item,
      line_total: item.rate * item.quantity
    }))

    const newInvoice = new Invoice({
      client_id,
      date_of_issue: date_of_issue ? new Date(date_of_issue) : new Date(),
      due_date: due_date ? new Date(due_date) : undefined,
      payment_method,
      payment_reference,
      status: status || 'draft',
      line_items: processedLineItems,
      tax_amount: tax_amount || 0,
      notes
    })

    await newInvoice.save()

    const invoiceWithData = await Invoice
      .findById(newInvoice._id)
      .populate('client_id')
      .lean()

    return NextResponse.json({
      ...invoiceWithData,
      id: invoiceWithData!._id.toString(),
      client: invoiceWithData!.client_id ? {
        ...invoiceWithData!.client_id,
        id: invoiceWithData!.client_id._id.toString()
      } : undefined
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
