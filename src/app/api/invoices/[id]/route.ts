import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Invoice } from '@/lib/models/schemas'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 })
    }

    const invoice = await Invoice
      .findById(id)
      .populate('client_id')
      .lean()

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...invoice,
      id: String((invoice as Record<string, unknown>)._id),
      total: (invoice as Record<string, unknown>).total || (invoice as Record<string, unknown>).amount || 0
    })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    
    const body = await request.json()
    const { status, payment_method, total } = body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (payment_method) updateData.payment_method = payment_method
    if (total !== undefined) updateData.total = total

    const updatedInvoice = await Invoice
      .findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      )
      .populate('client_id')

    if (!updatedInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...updatedInvoice.toObject(),
      id: String(updatedInvoice._id)
    })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 })
    }

    const deletedInvoice = await Invoice.findByIdAndDelete(id)

    if (!deletedInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Invoice deleted successfully' })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}
