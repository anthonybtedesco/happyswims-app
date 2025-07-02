import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()
    
    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('User auth error:', userError)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    console.log('Looking for instructor with phone:', phoneNumber)
    const { data: instructor, error: instructorError } = await supabase
      .from('instructor')
      .select('id, first_name, last_name, phone_number, user_id')
      .eq('phone_number', phoneNumber)
      .single()

    if (instructorError) {
      console.error('Instructor lookup error:', instructorError)
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }

    if (!instructor) {
      console.error('No instructor found for phone:', phoneNumber)
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }

    if (instructor.user_id) {
      console.log('Instructor already linked:', instructor.user_id)
      return NextResponse.json({ error: 'This instructor account is already linked to a user' }, { status: 400 })
    }

    console.log('Updating instructor:', instructor.id, 'with user:', user.id)
    const { data: updatedInstructor, error: updateError } = await supabase
      .from('instructor')
      .update({ 
        user_id: user.id
      })
      .eq('id', instructor.id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to link instructor account' }, { status: 500 })
    }

    console.log('Successfully linked instructor:', updatedInstructor)
    return NextResponse.json({ 
      success: true, 
      instructor: updatedInstructor 
    })

  } catch (error) {
    console.error('Error linking instructor:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 