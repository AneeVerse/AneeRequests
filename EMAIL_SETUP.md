# Email Setup for Invoice Sending

To enable invoice email functionality, you need to configure Gmail SMTP settings.

## Setup Steps

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. **Set Environment Variables**:
   ```bash
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   ```

## Features

- ✅ Send invoices as PDF attachments via Gmail
- ✅ Professional HTML email template
- ✅ Automatic invoice status update to "sent"
- ✅ Client email validation
- ✅ Loading states and error handling

## Usage

1. Create an invoice and select a client
2. Click the "Send" button on the invoice detail page
3. Confirm the email address
4. The invoice will be sent as a PDF attachment to the client's email

## Troubleshooting

- Make sure Gmail App Password is correctly set
- Check that the client has a valid email address
- Verify environment variables are loaded correctly
