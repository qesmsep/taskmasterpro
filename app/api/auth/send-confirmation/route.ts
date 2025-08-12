import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    console.log('Sending confirmation email to:', email)

    // Create confirmation link - use production URL for live site
    const baseUrl = process.env.VERCEL_URL 
      ? process.env.VERCEL_URL 
      : process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const confirmationLink = `${baseUrl}/auth/confirm?email=${encodeURIComponent(email)}`

    const { data, error } = await resend.emails.send({
      from: 'TaskMasterPro <onboarding@resend.dev>',
      to: email,
      subject: 'Confirm your TaskMasterPro account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007AFF;">Welcome to TaskMasterPro!</h2>
          <p>Hi ${name || 'there'},</p>
          <p>Thank you for signing up for TaskMasterPro! To complete your registration, please click the button below to confirm your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationLink}" 
               style="background-color: #007AFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Confirm Email Address
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${confirmationLink}</p>
          <p>This link will expire in 24 hours.</p>
          <p>Best regards,<br>The TaskMasterPro Team</p>
        </div>
      `,
    })

    if (error) {
      console.error('Error sending email:', error)
      return NextResponse.json(
        { error: 'Failed to send confirmation email' },
        { status: 500 }
      )
    }

    console.log('Confirmation email sent successfully:', data)

    return NextResponse.json(
      { 
        message: 'Confirmation email sent successfully',
        emailId: data?.id
      },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('Error in send-confirmation:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to send confirmation email',
        details: error.message
      },
      { status: 500 }
    )
  }
}
