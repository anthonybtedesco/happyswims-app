import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json()
    
    if (email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Invalid admin email' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'magiclink'
    })

    if (error) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
    }

    return NextResponse.json({ token: data.session?.access_token })
  } catch (error) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
} 