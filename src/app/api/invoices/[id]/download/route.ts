import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Invoice } from '@/lib/models/schemas'
import mongoose from 'mongoose'
import puppeteer from 'puppeteer'

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

    // Fetch invoice with client data
    const invoice = await Invoice
      .findById(id)
      .populate('client_id')
      .lean()

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const clientData = (invoice as Record<string, unknown>).client_id as Record<string, unknown> | undefined
    if (!clientData) {
      return NextResponse.json({ error: 'Client data not found' }, { status: 400 })
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice as Record<string, unknown>, clientData)

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${(invoice as Record<string, unknown>).invoice_number}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return NextResponse.json({ 
      error: 'Failed to generate PDF' 
    }, { status: 500 })
  }
}

async function generateInvoicePDF(invoice: Record<string, unknown>, clientData: Record<string, unknown>) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  try {
    const page = await browser.newPage()
    
    // Generate HTML for the invoice
    const html = generateInvoiceHTML(invoice, clientData)
    
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    })
    
    return pdf
  } finally {
    await browser.close()
  }
}

function generateInvoiceHTML(invoice: Record<string, unknown>, clientData: Record<string, unknown>) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const lineItems = (invoice.line_items as Array<Record<string, unknown>>) || []
  const lineItemsRows = lineItems.map((item) => `
    <tr>
      <td>${item.description || ''}</td>
      <td style="text-align:right;">${formatCurrency(Number(item.rate || 0))}</td>
      <td style="text-align:right;">${item.quantity || 0}</td>
      <td style="text-align:right;">${formatCurrency(Number(item.line_total || 0))}</td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          background: white;
          color: #333;
          line-height: 1.6;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #073742;
        }
        .company-info h1 {
          color: #073742;
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .company-info p {
          margin: 5px 0;
          color: #666;
          font-size: 14px;
        }
        .invoice-details {
          text-align: right;
        }
        .invoice-details h2 {
          color: #073742;
          margin: 0 0 10px 0;
          font-size: 24px;
        }
        .invoice-details p {
          margin: 3px 0;
          color: #666;
          font-size: 14px;
        }
        .client-info {
          margin-bottom: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        .client-info h3 {
          color: #073742;
          margin: 0 0 10px 0;
          font-size: 18px;
        }
        .client-info p {
          margin: 5px 0;
          color: #666;
          font-size: 14px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        .items-table th {
          background: #073742;
          color: white;
          padding: 15px;
          text-align: left;
          font-weight: 600;
          font-size: 14px;
        }
        .items-table td {
          padding: 15px;
          border-bottom: 1px solid #eee;
          font-size: 14px;
        }
        .items-table tbody tr:hover {
          background: #f8f9fa;
        }
        .items-table tfoot tr {
          background: #f8f9fa;
          font-weight: 600;
        }
        .items-table tfoot td {
          border-bottom: none;
          font-size: 16px;
        }
        .notes-section {
          margin: 30px 0;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        .notes-section h3 {
          color: #073742;
          margin: 0 0 10px 0;
          font-size: 16px;
        }
        .notes-content {
          color: #666;
          font-size: 14px;
          line-height: 1.6;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status-draft { background: #f3f4f6; color: #374151; }
        .status-sent { background: #dbeafe; color: #1e40af; }
        .status-paid { background: #d1fae5; color: #065f46; }
        .status-overdue { background: #fee2e2; color: #dc2626; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-info">
            <h1>AneeRequests</h1>
            <p>Professional Services</p>
            <p>Email: support@aneeverse.com</p>
            <p>Website: app.aneeverse.com</p>
          </div>
          <div class="invoice-details">
            <h2>INVOICE</h2>
            <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
            <p><strong>Date:</strong> ${formatDate(invoice.created_at as string)}</p>
            <p><strong>Due Date:</strong> ${invoice.due_date ? formatDate(invoice.due_date as string) : 'N/A'}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${invoice.status}">${invoice.status}</span></p>
          </div>
        </div>

        <div class="client-info">
          <h3>Bill To:</h3>
          <p><strong>${clientData.name}</strong></p>
          ${clientData.client_company_name ? `<p>${clientData.client_company_name}</p>` : ''}
          ${clientData.email ? `<p>${clientData.email}</p>` : ''}
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align:right;">Rate</th>
              <th style="text-align:right;">Quantity</th>
              <th style="text-align:right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align:right; font-weight:600; color: #073742;">Total</td>
              <td style="text-align:right; font-weight:700; color: #073742; font-size: 18px;">${formatCurrency(Number(invoice.total || invoice.amount || 0))}</td>
            </tr>
          </tfoot>
        </table>

        ${invoice.notes ? `
        <div class="notes-section">
          <h3>Notes</h3>
          <div class="notes-content">${(invoice.notes as string).replace(/</g,'&lt;')}</div>
        </div>
        ` : ''}

        <div class="footer">
          <p>Thank you for your business! | Powered by AneeRequests</p>
          <p style="margin-top: 8px; font-size: 12px;">This is a computer-generated invoice.</p>
        </div>
      </div>
    </body>
    </html>`
}
