import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: Request) {
  console.log('API Route: Starting password reset process')
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Has Service Role Key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

  try {
    const { email } = await request.json()
    console.log('API Route: Received reset request for email:', email)

    if (!email) {
      console.log('API Route: No email provided')
      return Response.json({ error: 'Email is required' }, { status: 400 })
    }

    // First, get the user to determine their role
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers()
    if (userError) {
      console.error('API Route: Error fetching user:', userError)
      return Response.json({ error: 'Failed to fetch user details' }, { status: 400 })
    }

    const user = users.find(u => u.email === email)
    if (!user) {
      console.error('API Route: User not found')
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const userRole = user.user_metadata?.role
    console.log('API Route: User role:', userRole)

    // Determine the correct redirect URL based on role
    let baseRedirectUrl
    switch (userRole) {
      case 'instructor':
        baseRedirectUrl = 'https://instructor.happyswims.life'
        break
      case 'client':
        baseRedirectUrl = 'https://book.happyswims.life'
        break
      default:
        baseRedirectUrl = 'https://happyswims.life'
    }

    const redirectTo = `${baseRedirectUrl}/reset-password`
    console.log('API Route: Using redirect URL:', redirectTo)

    try {
      console.log('API Route: Calling Supabase resetPasswordForEmail...')
      const { data, error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo
      })

      console.log('API Route: Supabase response:', { 
        hasData: !!data, 
        error: error || 'no error'
      })

      if (error) {
        console.error('API Route: Supabase error:', error)
        return Response.json({ 
          error: error.message || 'Failed to send reset email',
          details: error
        }, { status: 400 })
      }

      console.log('API Route: Successfully sent reset email')
      return Response.json({ 
        message: 'Password reset email sent successfully',
        debug: { redirectTo }
      })
    } catch (supabaseError: any) {
      console.error('API Route: Supabase exception:', supabaseError)
      return Response.json({ 
        error: 'Failed to send reset email',
        details: supabaseError?.message || 'Unknown Supabase error'
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('API Route: General error:', error)
    return Response.json({ 
      error: 'Password reset failed',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
} 