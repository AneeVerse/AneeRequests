import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import * as nodemailer from 'nodemailer'
import connectDB from '@/lib/mongodb'
import { User, PasswordReset, Client } from '@/lib/models/schemas'

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
})

export class AuthService {
  // Register a new user
  static async registerUser(email: string, password: string, name: string, role: 'admin' | 'client' = 'client') {
    await connectDB()
    
    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      throw new Error('User already exists with this email')
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      name,
      role,
      verification_token: verificationToken,
      is_verified: role === 'admin' // Admin is auto-verified
    })

    await user.save()

    // Send verification email for clients
    if (role === 'client') {
      try {
        await this.sendVerificationEmail(email, verificationToken, name)
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError)
        // Continue with registration even if email fails
      }
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      is_verified: user.is_verified,
      verification_token: role === 'client' ? verificationToken : undefined
    }
  }

  // Login user
  static async loginUser(email: string, password: string) {
    await connectDB()
    
    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      throw new Error('Invalid email or password')
    }

    // Check if user is verified (for clients)
    if (user.role === 'client' && !user.is_verified) {
      throw new Error('Please verify your email before logging in')
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      throw new Error('Invalid email or password')
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      client_id: user.client_id?.toString(),
      is_verified: user.is_verified
    }
  }

  // Verify email
  static async verifyEmail(token: string) {
    await connectDB()
    
    const user = await User.findOne({ verification_token: token })
    if (!user) {
      throw new Error('Invalid verification token')
    }

    user.is_verified = true
    user.verification_token = undefined
    await user.save()

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      is_verified: true
    }
  }

  // Request password reset
  static async requestPasswordReset(email: string) {
    await connectDB()
    
    const user = await User.findOne({ email })
    if (!user) {
      throw new Error('User not found')
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 3600000) // 1 hour

    // Save reset token
    const passwordReset = new PasswordReset({
      email,
      token: resetToken,
      expires: resetExpires
    })
    await passwordReset.save()

    // Send reset email
    try {
      await this.sendPasswordResetEmail(email, resetToken, user.name)
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      throw new Error('Failed to send password reset email. Please try again later.')
    }

    return { message: 'Password reset email sent' }
  }

  // Reset password
  static async resetPassword(token: string, newPassword: string) {
    await connectDB()
    
    // Find valid reset token
    const resetRecord = await PasswordReset.findOne({
      token,
      expires: { $gt: new Date() }
    })

    if (!resetRecord) {
      throw new Error('Invalid or expired reset token')
    }

    // Find user
    const user = await User.findOne({ email: resetRecord.email })
    if (!user) {
      throw new Error('User not found')
    }

    // Hash new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update user password
    user.password = hashedPassword
    await user.save()

    // Delete reset token
    await PasswordReset.deleteOne({ _id: resetRecord._id })

    return { message: 'Password reset successfully' }
  }

  // Change password (for logged-in users)
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    await connectDB()
    
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      throw new Error('Current password is incorrect')
    }

    // Hash new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password
    user.password = hashedPassword
    await user.save()

    return { message: 'Password changed successfully' }
  }

  // Admin utility: generate and email a temporary password
  static async adminSendTemporaryPassword(email: string) {
    await connectDB()

    let user = await User.findOne({ email })
    let isNewlyCreated = false
    if (!user) {
      // Create a verified client account if user doesn't exist
      isNewlyCreated = true
      user = new User({
        email,
        password: 'placeholder', // will be replaced below after hashing temp password
        name: email.split('@')[0] || 'User',
        role: 'client',
        is_verified: true
      })
    }

    // Generate a strong temporary password
    const tempPassword = crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)

    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(tempPassword, saltRounds)

    user.password = hashedPassword
    await user.save()

    // Try to email the temporary password
    let emailed = true
    try {
      await this.sendTemporaryPasswordEmail(email, tempPassword, user.name, isNewlyCreated)
    } catch (emailError) {
      console.error('Failed to send temporary password email:', emailError)
      emailed = false
    }

    const response: { success: boolean; message: string; tempPassword?: string } = {
      success: true,
      message: emailed
        ? (isNewlyCreated
            ? 'Account created and password sent to the email.'
            : 'Password sent to the user email.')
        : (isNewlyCreated
            ? 'Account created. Password generated; email not configured or failed.'
            : 'Password generated. Email not configured or failed; see server logs or use the returned value.')
    }

    // If email is not configured (dev), return the temp password so admin can share securely
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com' || !emailed) {
      response.tempPassword = tempPassword
      console.log(`Credentials — Email: ${email}, Password: ${tempPassword}`)
    }

    return response
  }

  // Create client account (admin function)
  static async createClientAccount(clientId: string, email: string, password: string) {
    await connectDB()
    
    // Check if client exists
    const client = await Client.findById(clientId)
    if (!client) {
      throw new Error('Client not found')
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      throw new Error('User already exists with this email')
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user account
    const user = new User({
      email,
      password: hashedPassword,
      name: client.name,
      role: 'client',
      client_id: clientId,
      is_verified: true // Auto-verify client accounts created by admin
    })

    await user.save()

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      client_id: user.client_id?.toString(),
      is_verified: true
    }
  }

  // Send verification email
  private static async sendVerificationEmail(email: string, token: string, name: string) {
    // Check if email configuration is set up
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
      console.log('Email configuration not set up. Skipping email verification.')
      console.log(`Verification URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`)
      return
    }

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your AneeRequests account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">Welcome to AneeRequests!</h2>
          <p>Hi ${name},</p>
          <p>Thank you for registering with AneeRequests. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>Best regards,<br>The AneeRequests Team</p>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)
  }

  // Send password reset email
  private static async sendPasswordResetEmail(email: string, token: string, name: string) {
    // Check if email configuration is set up
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
      console.log('Email configuration not set up. Skipping password reset email.')
      console.log(`Reset URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`)
      return
    }

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset your AneeRequests password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">Password Reset Request</h2>
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>Best regards,<br>The AneeRequests Team</p>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)
  }

  // Send credentials email (admin-triggered)
  private static async sendTemporaryPasswordEmail(email: string, tempPassword: string, name: string, isNewlyCreated: boolean) {
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
      console.log('Email configuration not set up. Skipping temporary password email.')
      return
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your AneeRequests account credentials',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">Account Credentials</h2>
          <p>Hi ${name || 'there'},</p>
          ${isNewlyCreated ? '<p>Your account has been created for you.</p>' : '<p>Your password has been updated.</p>'}
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${tempPassword}</p>
          <p>These credentials are active now. For your security, log in and change this password immediately from Settings → Change Password.</p>
          <p>Best regards,<br/>AneeRequests</p>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)
  }
}
