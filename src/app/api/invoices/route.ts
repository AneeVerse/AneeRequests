import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Invoice } from '@/lib/models/schemas'

type PopulatedInvoice = {
  _id: unknown
  client_id?: { _id: unknown } | undefined
  [key: string]: unknown
}

type LineItemInput = {
  description: string
  service_catalog_item_id?: string
  rate: number
  quantity: number
  line_total: number
}

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')
    
    const query: Record<string, unknown> = {}
    
    // Filter by client if client_id is provided
    if (clientId) {
              try {
          const mongoose = await import('mongoose')
          ;(query as Record<string, unknown>).client_id = new mongoose.Types.ObjectId(clientId)
        } catch (error) {
        console.error('Invalid clientId format:', clientId, error)
        return NextResponse.json({ error: 'Invalid client ID format' }, { status: 400 })
      }
    }
    
    const invoices = await Invoice
      .find(query)
      .populate({
        path: 'client_id',
        model: 'Client'
      })
      .sort({ created_at: -1 })
      .lean<PopulatedInvoice[]>()

    const invoicesWithIds = invoices.map((invoice) => {
      const clientData = invoice.client_id as Record<string, unknown> | undefined;
      
      return {
        ...invoice,
        id: String(invoice._id),
        total: invoice.total || invoice.amount || 0, // Use total or fallback to amount
        client: clientData ? {
          ...clientData,
          id: String((clientData as { _id: unknown })._id),
          client_company: clientData.client_company_name ? {
            name: clientData.client_company_name as string
          } : undefined
        } : undefined
      };
    })

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
      currency,
      status,
      line_items,
      tax_amount,
      notes 
    }: {
      client_id: string
      date_of_issue?: string
      due_date?: string
      payment_method?: string
      payment_reference?: string
      currency?: string
      status?: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled'
      line_items: LineItemInput[]
      tax_amount?: number
      notes?: string
    } = body

    if (!client_id || !line_items || line_items.length === 0) {
      return NextResponse.json({ 
        error: 'client_id and at least one line item are required' 
      }, { status: 400 })
    }

    // Validate line items
    for (const item of line_items) {
      if (!item.description || !item.description.trim()) {
        return NextResponse.json({ 
          error: 'All line items must have a description' 
        }, { status: 400 })
      }
      if (item.rate <= 0) {
        return NextResponse.json({ 
          error: 'All line items must have a rate greater than 0' 
        }, { status: 400 })
      }
      if (item.quantity <= 0) {
        return NextResponse.json({ 
          error: 'All line items must have a quantity greater than 0' 
        }, { status: 400 })
      }
    }

    // Validate and calculate line totals
    const processedLineItems = line_items.map((item) => ({
      ...item,
      line_total: item.rate * item.quantity
    }))

    // Calculate total from line items
    const subtotal = processedLineItems.reduce((sum, item) => sum + item.line_total, 0)
    const total = subtotal + (tax_amount || 0)

    // Generate a unique invoice number
    const generateInvoiceNumber = async (): Promise<string> => {
      const currentYear = new Date().getFullYear()
      const timestamp = Date.now()
      const random = Math.floor(Math.random() * 10000)
      
      return `INV-${currentYear}${timestamp}${random}`
    }
    
    let invoice_number: string = ''
    let attempts = 0
    const maxAttempts = 5
    
    // Try to generate a unique invoice number
    while (attempts < maxAttempts) {
      try {
        invoice_number = await generateInvoiceNumber()
        
        // Verify the invoice number is valid
        if (!invoice_number || invoice_number.trim() === '') {
          throw new Error('Generated invoice number is empty')
        }
        
        // Check if this invoice number already exists
        const existingInvoice = await Invoice.findOne({ invoice_number })
        if (!existingInvoice) {
          break // Found a unique invoice number
        }
        
        attempts++
      } catch (error) {
        console.error(`Attempt ${attempts + 1} failed to generate invoice number:`, error)
        attempts++
      }
    }
    
    if (attempts >= maxAttempts || !invoice_number) {
      return NextResponse.json({ 
        error: 'Failed to generate unique invoice number after multiple attempts' 
      }, { status: 500 })
    }

    // Create the invoice document
    const invoiceData = {
      invoice_number,
      client_id,
      date_of_issue: date_of_issue ? new Date(date_of_issue) : new Date(),
      due_date: due_date ? new Date(due_date) : undefined,
      payment_method,
      payment_reference,
      status: status || 'draft',
      line_items: processedLineItems,
      subtotal,
      tax_amount: tax_amount || 0,
      total,
      notes,
      currency: currency || 'USD',
      amount: total // Add the old 'amount' field for backward compatibility
    }



    const newInvoice = new Invoice(invoiceData)
    await newInvoice.save()

    const invoiceWithData = await Invoice
      .findById(newInvoice._id)
      .populate('client_id')
      .lean<PopulatedInvoice>()

    return NextResponse.json({
      ...invoiceWithData,
      id: String(invoiceWithData!._id)
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json({ 
      error: 'Failed to create invoice',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
