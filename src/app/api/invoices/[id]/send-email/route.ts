import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Invoice } from '@/lib/models/schemas'
import mongoose from 'mongoose'
import * as nodemailer from 'nodemailer'
import puppeteer from 'puppeteer'

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
})

export async function POST(
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
    if (!clientData || !clientData.email) {
      return NextResponse.json({ error: 'Client email not found' }, { status: 400 })
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice as Record<string, unknown>, clientData)

    // Send email
    await sendInvoiceEmail(
      clientData.email as string,
      clientData.name as string,
      (invoice as Record<string, unknown>).invoice_number as string,
      Buffer.from(pdfBuffer)
    )

    // Update invoice status to 'sent'
    await Invoice.findByIdAndUpdate(id, { status: 'sent' })

    return NextResponse.json({ 
      success: true, 
      message: 'Invoice sent successfully' 
    })

  } catch (error) {
    console.error('Error sending invoice email:', error)
    return NextResponse.json({ 
      error: 'Failed to send invoice email',
      details: error instanceof Error ? error.message : 'Unknown error'
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
    const currency = (invoice.currency as string) || 'USD'
    const locale = currency === 'INR' ? 'en-IN' : 
                   currency === 'EUR' ? 'en-EU' : 
                   currency === 'GBP' ? 'en-GB' : 
                   currency === 'JPY' ? 'ja-JP' : 'en-US'
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const lineItemsRows = (invoice.line_items as Array<Record<string, unknown>>).map((item: Record<string, unknown>) => `
    <tr>
      <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;vertical-align:top;">${item.description}</td>
      <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;text-align:right;vertical-align:top;">${formatCurrency(item.rate as number)}</td>
      <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;text-align:right;vertical-align:top;">${item.quantity}</td>
      <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;text-align:right;vertical-align:top;font-weight:600;">${formatCurrency(item.line_total as number)}</td>
    </tr>
  `).join('')

  return `<!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoice_number}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
          color: #1f2937; 
          background: #ffffff;
          line-height: 1.6;
        }
        .container { 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 40px 30px; 
          background: #ffffff;
        }
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
          margin-bottom: 40px;
          padding-bottom: 30px;
          border-bottom: 3px solid #073742;
        }
        .company-info h1 {
          font-size: 32px;
          font-weight: 700;
          color: #073742;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        .company-info .tagline {
          color: #6b7280;
          font-size: 16px;
          font-weight: 500;
        }
        .invoice-details {
          text-align: right;
        }
        .invoice-number {
          font-size: 28px;
          font-weight: 700;
          color: #073742;
          margin-bottom: 8px;
        }
        .invoice-date {
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
        }
        .client-section {
          margin-bottom: 40px;
          padding: 25px;
          background: linear-gradient(135deg, #f0f7f9 0%, #e1eff4 100%);
          border-radius: 12px;
        }
        .client-section h3 {
          color: #073742;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .client-info {
          color: #374151;
          font-size: 16px;
          line-height: 1.8;
        }
        .client-info strong {
          color: #073742;
          font-weight: 600;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .items-table thead {
          background: linear-gradient(135deg, #073742 0%, #0f7fa7 100%);
        }
        .items-table th {
          font-size: 12px;
          text-transform: uppercase;
          color: #ffffff;
          text-align: left;
          padding: 20px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .items-table th:last-child {
          text-align: right;
        }
        .items-table tbody tr:nth-child(even) {
          background: #f9fafb;
        }
        .items-table tbody tr:hover {
          background: #f0f7f9;
        }
        .items-table tfoot {
          background: #f8fafc;
          border-top: 2px solid #073742;
        }
        .items-table tfoot td {
          font-weight: 600;
          padding: 20px;
        }
        .items-table tfoot td:last-child {
          text-align: right;
          font-size: 18px;
          color: #073742;
        }
        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }
        .totals-box {
          background: linear-gradient(135deg, #f0f7f9 0%, #e1eff4 100%);
          padding: 25px 30px;
          border-radius: 12px;
          border: 2px solid #073742;
          min-width: 300px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 16px;
        }
        .total-row.final {
          border-top: 2px solid #073742;
          padding-top: 15px;
          margin-top: 15px;
          font-size: 20px;
          font-weight: 700;
          color: #073742;
        }
        .notes-section {
          background: #f8fafc;
          padding: 25px;
          border-radius: 12px;
        }
        .notes-section h3 {
          color: #073742;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .notes-content {
          color: #374151;
          font-size: 16px;
          line-height: 1.8;
          white-space: pre-wrap;
        }
        .footer {
          margin-top: 50px;
          padding-top: 30px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 20px;
        }
        .status-${invoice.status} {
          background: ${invoice.status === 'paid' ? '#dcfce7' : invoice.status === 'pending' ? '#fef3c7' : '#fee2e2'};
          color: ${invoice.status === 'paid' ? '#166534' : invoice.status === 'pending' ? '#92400e' : '#991b1b'};
        }
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .container { margin: 0; padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-info">
            <h1>AneeRequests</h1>
            <div class="tagline">Professional Request Management</div>
          </div>
          <div class="invoice-details">
            <div class="status-badge status-${invoice.status}">${(invoice.status as string).toUpperCase()}</div>
            <div class="invoice-number">${invoice.invoice_number}</div>
            <div class="invoice-date">Date of Issue: ${formatDate(invoice.date_of_issue as string)}</div>
            ${invoice.due_date ? `<div class="invoice-date" style="margin-top: 8px;">Due Date: ${formatDate(invoice.due_date as string)}</div>` : ''}
          </div>
        </div>

        <div class="client-section">
          <h3>Bill To</h3>
          <div class="client-info">
            <div><strong>${clientData.name || 'N/A'}</strong></div>
            ${clientData.client_company_name ? `<div>${clientData.client_company_name}</div>` : ''}
            ${clientData.email ? `<div>${clientData.email}</div>` : ''}
          </div>
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
              <td style="text-align:right; font-weight:700; color: #073742; font-size: 18px;">${formatCurrency(invoice.total as number)}</td>
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

async function sendInvoiceEmail(
  clientEmail: string, 
  clientName: string, 
  invoiceNumber: string, 
  pdfBuffer: Buffer
) {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
    console.log('Email configuration not set up. Skipping invoice email.')
    return
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: clientEmail,
    subject: `Invoice ${invoiceNumber} from AneeRequests`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #073742;">Invoice ${invoiceNumber}</h2>
        <p>Hi ${clientName || 'there'},</p>
        <p>Please find attached your invoice ${invoiceNumber} from AneeRequests.</p>
        <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
        <p>Best regards,<br/>AneeRequests Team</p>
      </div>
    `,
    attachments: [
      {
        filename: `invoice-${invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  }

  await transporter.sendMail(mailOptions)
}
