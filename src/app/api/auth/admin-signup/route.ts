import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: Request) {
  try {
    const { email, role } = await request.json()

    if (!email || !role) {
      return Response.json({ error: 'Email and role are required' }, { status: 400 })
    }

    // Validate role
    if (role !== 'instructor' && role !== 'client') {
      return Response.json({ error: 'Invalid role' }, { status: 400 })
    }

    const randomPassword = crypto.randomUUID().substring(0, 12)
    
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { 
        role,
        passwordNeedsChange: true
      },
      password: randomPassword
    })

    if (error) {
      console.error('Admin signup error:', error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    // Send password reset email
    if (data.user) {
      const origin = request.headers.get('origin') || 'http://localhost:3000'
      const resetError = await sendPasswordResetEmail(email, `${origin}/reset-password`)
      
      if (resetError) {
        console.error('Error sending reset email:', resetError)
        // We still return success even if the email fails, as the user was created
      }
    }

    return Response.json({ user: data.user })
  } catch (error: any) {
    console.error('Admin signup error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

async function sendPasswordResetEmail(email: string, redirectTo: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo
      }
    })
    
    return error
  } catch (error) {
    return error
  }
} 