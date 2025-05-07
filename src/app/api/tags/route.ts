import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const { data: tags, error } = await supabaseAdmin
      .from('tag')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    
    return NextResponse.json(tags)
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, color, description } = await request.json()
    
    if (!name) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 })
    }
    
    // Check if a tag with this name already exists
    const { data: existingTag, error: existingTagError } = await supabaseAdmin
      .from('tag')
      .select('*')
      .eq('name', name)
      .single()
    
    if (existingTagError && existingTagError.code !== 'PGRST116') {
      throw existingTagError
    }
    
    if (existingTag) {
      return NextResponse.json({ error: 'A tag with this name already exists' }, { status: 409 })
    }
    
    const { data: newTag, error: insertError } = await supabaseAdmin
      .from('tag')
      .insert({
        name,
        color: color || '#10b981',
        description
      })
      .select()
      .single()
    
    if (insertError) throw insertError
    
    return NextResponse.json(newTag, { status: 201 })
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
} 