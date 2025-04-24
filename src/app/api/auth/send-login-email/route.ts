import { createClient } from '@supabase/supabase-js'
import { SendMailClient } from 'zeptomail'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function sendEmail(to: string, subject: string, htmlBody: string) {
  const url = "api.zeptomail.com/"
  const token = "Zoho-enczapikey wSsVR60g+0T4B/x8zTWpI+wwyFVRBl/0HUR52wCo6SL9FvGX8sdvlxKcV1WgSaMXEDNqRe1U4J3x17qnvhDzMWm9ZlxONJIoPxQ9qnGRgF88n+g=="

  const client = new SendMailClient({url, token})

  try {
    const response = await client.sendMail({
      from: {
        address: "noreply@agfarms.dev",
        name: "noreply"
      },
      to: [
        {
          email_address: {
            address: to,
            name: to.split('@')[0]
          }
        }
      ],
      subject,
      htmlbody: htmlBody
    })
    
    return { data: response, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function POST(request: Request) {
  try {
    const { userId, userEmail } = await request.json()

    if (!userId || !userEmail) {
      return Response.json({ error: 'User ID and email are required' }, { status: 400 })
    }

    // Generate a temporary password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    const tempPassword = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map((byte) => chars[byte % chars.length])
      .join('')

    // Update user's password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: tempPassword }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return Response.json({ error: 'Failed to update password' }, { status: 400 })
    }

    // Send email with login credentials
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your Login Credentials</h2>
        <p style="color: #666;">Here are your temporary login credentials:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Email:</strong> ${userEmail}</p>
          <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
        </div>
        <p style="color: #666;">Please log in and change your password immediately for security purposes.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    `

    const { error: emailError } = await sendEmail(
      userEmail,
      'Your Login Credentials',
      emailHtml
    )

    if (emailError) {
      console.error('Error sending email:', emailError)
      return Response.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return Response.json({ message: 'Login credentials sent successfully' })
  } catch (error: any) {
    console.error('Error in send-login-email:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
} 